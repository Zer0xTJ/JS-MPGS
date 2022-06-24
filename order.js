import mongooseSequence from "mongoose-sequence";
import mongoose from "mongoose";
import nbeAPI from "./nbe_api";
import asyncLib from "async";
import nanoid from "nanoid";

function genTxn({
  length = 20,
  chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  split = true,
} = {}) {
  let txn = nanoid.customAlphabet(chars, length)();
  if (!split) return txn;
  return txn.slice(0, 10) + "-" + txn.slice(10, 20);
}

const orderCreationQueue = asyncLib.queue((order, completed) => {
  order.save().then((saved) => {
    saved.prefixOrderNumber = "ORDER-PREFIX-" + saved.orderNumber;
    saved.save().then((saved2) => {
      const tasksRemaining = orderCreationQueue.length();
      completed(null, { createdOrder: saved2, tasksRemaining });
    });
  });
}, 1);

const AutoIncrement = mongooseSequence(mongoose);

const { Schema } = mongoose;

let schema = new Schema({
  userId: Number,
  userIP: String,
  orderId: String,
  currency: { type: String, default: "EGP" },
  amount: { type: Number, default: 0 },
  // transactions used in hosted session
  prefixOrderNumber: { type: String, default: "" },
  txn1: { type: String, default: "" },
  txn2: { type: String, default: "" },
  txnId: { type: String, default: "" },
  // session
  sessionId: { type: String, default: "" },
  //
  customer: {
    fname: String,
    lname: String,
    email: String,
    phone: String,
  },
  ///
  status: {
    type: String,
    enum: ["pending", "fail", "completed"],
    default: "pending",
  },
  device: {
    browserDetails: {
      javaEnabled: { type: String, default: "true" },
      language: { type: String, default: "json" },
      screenWidth: { type: String, default: "1000" },
      screenHeight: { type: String, default: "400" },
      timeZone: { type: String, default: "+200" },
      colorDepth: { type: String, default: "20" },
      acceptHeaders: { type: String, default: "512" },
    },
    browser: { type: String, default: "browser" },
    ipAddress: { type: String, default: "192.0.1.1" },
  },
  paymentResponseCode: String,
  paymentResponseMsg: String,
  createdAt: { type: Date, default: Date.now },
});

schema.methods.queueSave = function (cb) {
  let order = this;
  orderCreationQueue.push(order, cb);
};

schema.methods.initOrder = async function () {
  let order = this;
  // initiate session
  let sessionData = await order.initSession();
  if (!sessionData.status) return false;
  // update session with order information -> id, currency, amount
  await order.updateSessionOrder();
  await order.save();
  // created successfully
  return order;
};

schema.methods.initSession = async function () {
  let order = this;
  // create transaction numbers
  // order.txn1 = genTxn({ split: false });
  // order.txn2 = genTxn({ split: false });
  order.txn1 = `N3SB-TXN${order.orderNumber}-${genTxn({
    length: 10,
    split: false,
  })}`;
  order.txn2 = `N3SB-TXN${order.orderNumber}-${genTxn({
    length: 10,
    split: false,
  })}`;
  // create session
  let resp = await nbeAPI.createSession();
  await order.save();
  if (resp.result === "SUCCESS") {
    order.sessionId = resp.session.id;
    return { status: true };
  } else {
    return { status: false, resp };
  }
};

schema.methods.updateSessionOrder = async function () {
  let order = this;
  let resp = await nbeAPI.updateSessionOrder({
    sessionId: order.sessionId,
    orderId: order.prefixOrderNumber,
    amount: order.amount,
    currency: order.currency,
  });
  // console.log("UPDATE ORDER:", resp);
  return resp;
};

schema.methods.updateSessionCard = async function ({
  cardNumber,
  expiryMonth,
  expiryYear,
  securityCode,
} = {}) {
  let order = this;
  let resp = await nbeAPI.updateSessionCard({
    sessionId: order.sessionId,
    cardNumber,
    expiryMonth,
    expiryYear,
    securityCode,
  });

  // console.log("UPDATE SESSION CARD:", resp);
  if (resp.result === "ERROR") {
    return { status: false, resp };
  } else {
    return { status: true, resp };
  }
};

schema.methods.initSessionAuth = async function () {
  let order = this;
  let resp = await nbeAPI.initSessionAuth({
    sessionId: order.sessionId,
    orderId: order.prefixOrderNumber,
    txn1: order.txn1,
    currency: order.currency,
    amount: order.amount,
  });
  // console.log("INIT SESSION AUTH:", resp);
  return resp;
};

schema.methods.authenticatePayer = async function () {
  let order = this;
  let resp = await nbeAPI.authenticatePayer({
    sessionId: order.sessionId,
    orderId: order.prefixOrderNumber,
    txn1: order.txn1,
    currency: order.currency,
    amount: order.amount,
    fname: order.customer.fname,
    lname: order.customer.lname,
    email: order.customer.email,
    device: JSON.parse(JSON.stringify(order.device)),
  });
  // console.log("TXN1:", order.txn1);
  // console.log("order:", order.prefixOrderNumber);
  // console.log("AUTH PAYER:", resp);
  if (resp?.error?.cause === "SERVER_BUSY") {
    return await order.authenticatePayer();
  } else {
    if (resp.authentication) {
      if (resp.authentication["3ds"]) {
        order.txnId = resp.authentication["3ds"].transactionId;
      }
    }

    await order.save();
    return { resp, order };
  }
};

schema.methods.pay = async function () {
  let order = this;
  let resp = await nbeAPI.pay({
    sessionId: order.sessionId,
    orderId: order.prefixOrderNumber,
    txn1: order.txn1,
    txn2: order.txn2,
    currency: order.currency,
    amount: order.amount,
  });
  if (resp.authentication) {
    if (resp.authentication["3ds"]) {
      order.txnId = resp.authentication["3ds"].transactionId;
    }
  }
  order.paymentResponseCode = resp.response?.acquirerCode;
  order.paymentResponseMsg = resp.response?.acquirerMessage;
  // console.log("PAY:", resp);
  await order.save();
  return { resp, order };
};

// try add increment field
try {
  schema.plugin(AutoIncrement, {
    id: "orderNumberInc",
    inc_field: "orderNumber",
  });
} catch (e) {}

// try compile
try {
  module.exports = mongoose.model("Order", schema);
} catch (e) {}
