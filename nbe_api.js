import fetch from "node-fetch";

const {
  MARCHANT_AUTH_USERNAME, // for auth header
  MARCHANT_AUTH_PASSWORD, // for auth header
  MARCHANT, // for url params
  NBE_REDIRECT_URL, // for redirection after otp
  NBE_API, // base api url
} = process.env;

const AUTH =
  "Basic " +
  Buffer.from(`${MARCHANT_AUTH_USERNAME}:${MARCHANT_AUTH_PASSWORD}`).toString(
    "base64"
  );

const HEADERS = {
  Authorization: AUTH,
  "Content-Type": "application/x-www-form-urlencoded",
};

module.exports = {
  /**
   * REUSABLE METHOD
   * make request with required header to shuttlebus api
   */
  BASE_URL: NBE_API + MARCHANT, // no trailing slash
  toFormUrlEncoded(object) {
    if (!object) return "";
    object = JSON.parse(JSON.stringify(object));
    return Object.entries(object)
      .map(([key, value]) => {
        if (value === null || value === undefined) return "";
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join("&");
  },
  async makeRequest({
    endpoint,
    method,
    params,
    body,
    customHeaders = {},
    isJsonRequest = false,
  } = {}) {
    let canBody = !["get", "head"].includes(method.toLowerCase());
    let requestHeaders = { ...HEADERS, ...customHeaders };
    if (isJsonRequest) {
      requestHeaders["Content-Type"] = "application/json";
    }
    let urlParams = this.toFormUrlEncoded(params);
    let url = `${this.BASE_URL}${endpoint}`;
    if (urlParams) {
      url = `${this.BASE_URL}${endpoint}?${urlParams}`;
    }
    if (!isJsonRequest) {
      body = this.toFormUrlEncoded(body);
    } else {
      body = JSON.stringify(body);
    }

    // console.log(url);
    // console.log(body);

    const response = await fetch(url, {
      method,
      body: canBody ? body : null,
      headers: requestHeaders,
    }).then((resp) => {
      return resp;
    });
    try {
      const data = await response.json();
      return data;
    } catch (err) {
      return { status: false, err: err.toString() };
    }
  },
  async createSession() {
    let resp = await this.makeRequest({
      isJsonRequest: true,
      endpoint: "/session",
      method: "POST",
      body: { session: { authenticationLimit: 25 } },
    });
    return resp;
  },
  async updateSessionOrder({
    sessionId,
    orderId,
    amount,
    currency = "EGP",
  } = {}) {
    let resp = await this.makeRequest({
      isJsonRequest: true,
      endpoint: "/session/" + sessionId,
      method: "PUT",
      body: {
        apiOperation: "UPDATE_SESSION",
        order: {
          id: orderId,
          currency,
          amount,
        },
      },
    });
    return resp;
  },
  async updateSessionCard({
    sessionId,
    cardNumber,
    expiryMonth,
    expiryYear,
    securityCode,
  } = {}) {
    let resp = await this.makeRequest({
      isJsonRequest: true,
      endpoint: "/session/" + sessionId,
      method: "PUT",
      body: {
        apiOperation: "UPDATE_SESSION",
        sourceOfFunds: {
          provided: {
            card: {
              number: cardNumber,
              expiry: {
                month: expiryMonth,
                year: expiryYear,
              },
              securityCode,
            },
          },
        },
      },
    });
    return resp;
  },
  async initSessionAuth({ sessionId, orderId, txn1, currency } = {}) {
    let resp = await this.makeRequest({
      isJsonRequest: true,
      endpoint: `/order/${orderId}/transaction/${txn1}`,
      method: "PUT",
      body: {
        apiOperation: "INITIATE_AUTHENTICATION",
        session: {
          id: sessionId,
        },
        order: {
          currency,
        },
        authentication: {
          acceptVersions: "3DS1,3DS2",
          channel: "PAYER_BROWSER",
          purpose: "PAYMENT_TRANSACTION",
        },
      },
    });
    return resp;
  },
  async authenticatePayer({
    sessionId,
    orderId,
    txn1,
    currency,
    amount,
    fname,
    lname,
    // email,
    device,
  } = {}) {
    let resp = await this.makeRequest({
      isJsonRequest: true,
      endpoint: `/order/${orderId}/transaction/${txn1}`,
      method: "PUT",
      body: {
        apiOperation: "AUTHENTICATE_PAYER",
        order: {
          currency: currency,
          amount: amount,
        },
        session: {
          id: sessionId,
        },
        authentication: {
          redirectResponseUrl: NBE_REDIRECT_URL,
        },
        customer: {
          firstName: fname,
          // email: email,
          lastName: lname,
        },
        device: {
          browserDetails: {
            javaEnabled: device.browserDetails.javaEnabled,
            language: device.browserDetails.language,
            screenHeight: device.browserDetails.screenHeight,
            screenWidth: device.browserDetails.screenWidth,
            timeZone: device.browserDetails.timeZone,
            colorDepth: device.browserDetails.colorDepth,
            acceptHeaders: device.browserDetails.acceptHeaders,
            "3DSecureChallengeWindowSize": "FULL_SCREEN", // you can edit the iframe size here
          },
          browser: device.browser,
          ipAddress: device.ipAddress,
        },
        // device: {
        //   browserDetails: {
        //     javaEnabled: "true",
        //     language: "json",
        //     screenHeight: "1000",
        //     screenWidth: "400",
        //     timeZone: "+200",
        //     colorDepth: "20",
        //     acceptHeaders: "512",
        //     "3DSecureChallengeWindowSize": "250_X_400",
        //   },
        //   browser: "Chrome",
        //   ipAddress: "192.0.1.1",
        // },
      },
    });
    return resp;
  },

  async pay({ sessionId, orderId, txn1, txn2, currency, amount } = {}) {
    let resp = await this.makeRequest({
      isJsonRequest: true,
      endpoint: `/order/${orderId}/transaction/${txn2}`,
      method: "PUT",
      body: {
        apiOperation: "PAY",
        order: {
          currency: currency,
          amount: amount,
        },
        session: {
          id: sessionId,
        },
        sourceOfFunds: {
          type: "CARD",
        },
        authentication: {
          transactionId: txn1,
        },
      },
    });
    return resp;
  },
};
