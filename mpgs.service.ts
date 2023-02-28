import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios, RawAxiosRequestHeaders } from 'axios';
import { ConfigKeys } from 'src/core/config';

// TODO: refactor the interfaces that has the same structure

// TODO: confirm all values are correct
export enum ResultResponse {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

// TODO: confirm all values are correct
export enum UpdateSessionResult {
  NO_UPATE = 'NO_UPATE',
  UPDATE = 'UPDATE',
}
// TODO: confirm all values are correct
export enum AuthenticationStatus {
  AUTHENTICATION_INITIATED = 'AUTHENTICATION_INITIATED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHENTICATION_AVAILABLE = 'AUTHENTICATION_AVAILABLE',
  AUTHENTICATION_IN_PROGRESS = 'AUTHENTICATION_IN_PROGRESS',
  AUTHENTICATION_SUCCESSFUL = 'AUTHENTICATION_SUCCESSFUL',
  AUTHENTICATION_PENDING = 'AUTHENTICATION_PENDING',
}

// TODO: confirm all values are correct
export enum GatewayRecommendation {
  PROCEED = 'PROCEED',
}

// TODO: confirm all values are correct
export enum TransactionType {
  AUTHENTICATION = 'AUTHENTICATION',
}

// TODO: confirm all values are correct
export enum GatewayCode {
  AUTHENTICATION = 'AUTHENTICATION',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

// TODO: confirm all values are correct
export enum OrderStatus {
  CAPTURED = 'CAPTURED',
}

// TODO: confirm all values are correct
export enum PayerInteraction {
  REQUIRED = 'REQUIRED',
  NOT_REQUIRED = 'NOT_REQUIRED',
}

export enum SecChallengeWindowSize {
  FULL_SCREEN = 'FULL_SCREEN',
  S_250_X_400 = '250_X_400',
}

/**
 * @description MPGS API response when creating a session
 */
export interface IMPGCreateSessionResp {
  merchant: string;
  result: ResultResponse;
  session: {
    aes256Key: string;
    authenticationLimit: number;
    id: string;
    updateStatus: UpdateSessionResult;
    version: string;
  };
}

/**
 * @description MPGS order data that will be sent when updating a session order for first time
 */
export interface IMPGSSessionOrder {
  currency: string;
  id: string;
  amount: number;
}

/**
 * @description MPGS API response when updating a session with an order data
 */
export interface IMPGSUpdateSessionResp {
  merchant: string;
  order: IMPGSSessionOrder;
  session: {
    id: string;
    updateStatus: ResultResponse;
    version: string;
  };
  version: string;
}

/**
 * @description MPGS card data that will be sent when updating a session with card data
 */
export interface IMPGSSessionCard {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: string;
  securityCode: string;
}

/**
 * @description MPGS API response when updating a session with card data
 */
export interface IMPGSUpdateSessionCardResp {
  merchant: string;
  order: IMPGSSessionOrder;
  session: {
    id: string;
    updateStatus: ResultResponse;
    version: string;
  };
  sourceOfFunds: {
    provided: {
      card: {
        brand: string;
        expiry: {
          month: string;
          year: string;
        };
        fundingMethod: string;
        localBrand: string;
        number: string;
        scheme: string;
        securityCode: string;
      };
    };
  };
  version: '61';
}
/**
 * @description MPGS API the body of the request to initiate authentication
 */
export interface IMPGSInitSessionAuthBody {
  sessionId: string;
  orderId: string;
  txn1: string;
  currency: string;
}

/**
 * @description MPGS API response when initiating authentication
 */
export interface IMPGSInitSessionAuthResp {
  authentication: {
    '3ds1': {
      veResEnrolled: string;
    };
    acceptVersions: string;
    channel: string;
    purpose: string;
    redirect: {
      customized: {
        '3DS': {
          methodPostData: string;
          methodUrl: string;
        };
      };
    };
    redirectHtml: string;
    version: string;
  };
  merchant: string;
  order: {
    authenticationStatus: AuthenticationStatus;
    creationTime: string;
    currency: string;
    id: string;
    lastUpdatedTime: string;
    merchantCategoryCode: string;
    status: AuthenticationStatus;
    totalAuthorizedAmount: number;
    totalCapturedAmount: number;
    totalRefundedAmount: number;
  };
  response: {
    gatewayCode: AuthenticationStatus;
    gatewayRecommendation: GatewayRecommendation;
  };
  result: ResultResponse;
  sourceOfFunds: {
    provided: {
      card: {
        brand: string;
        fundingMethod: string;
        number: string;
        scheme: string;
      };
    };
    type: string;
  };
  timeOfLastUpdate: string;
  timeOfRecord: string;
  transaction: {
    amount: number;
    authenticationStatus: AuthenticationStatus;
    currency: string;
    id: string;
    type: TransactionType;
  };
  version: string;
}

/**
 * @description MPGS API payload to authenticate a payer
 */
export interface IMPGSAuthenticatePayerBody {
  sessionId: string;
  orderId: string;
  txn1: string;
  currency: string;
  amount: string;
  fname: string;
  lname: string;
  email: string;
  device: {
    browserDetails: {
      javaEnabled: 'true' | 'false';
      language: 'json';
      screenHeight: string;
      screenWidth: string;
      timeZone: string;
      colorDepth: string;
      acceptHeaders: string;
      '3DSecureChallengeWindowSize': SecChallengeWindowSize | string;
    };
    browser: string;
    ipAddress: string;
  };
}

/**
 * @description MPGS API response when authenticating a payer
 */
export interface IMPGSAuthenticatePayerResp {
  authentication: {
    '3ds': {
      acsEci: string;
      authenticationToken: string;
      transactionId: string;
    };
    '3ds1': {
      veResEnrolled: string;
    };
    '3ds2': {
      '3dsServerTransactionId': string;
      acsTransactionId: string;
      directoryServerId: string;
      dsTransactionId: string;
      methodSupported: string;
      protocolVersion: string;
      requestorId: string;
      requestorName: string;
      transactionStatus: string;
    };
    payerInteraction: PayerInteraction;
    redirect: {
      domainName: string;
      customized: {
        '3DS': {
          acsUrl: string;
          cReq: string;
        };
      };
    };
    redirectHtml: string;
    version: string;
  };
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  device: {
    browser: string;
    ipAddress: string;
  };
  merchant: string;
  order: {
    amount: number;
    authenticationStatus: AuthenticationStatus;
    creationTime: string;
    currency: string;
    id: string;
    lastUpdatedTime: string;
    merchantCategoryCode: string;
    status: AuthenticationStatus;
    totalAuthorizedAmount: number;
    totalCapturedAmount: number;
    totalRefundedAmount: number;
    valueTransfer: {
      accountType: string;
    };
  };
  response: {
    gatewayCode: GatewayCode;
    gatewayRecommendation: GatewayRecommendation;
  };
  result: ResultResponse;
  sourceOfFunds: {
    provided: {
      card: {
        brand: string;
        expiry: {
          month: string;
          year: string;
        };
        fundingMethod: string;
        number: string;
        scheme: string;
      };
    };
    type: string;
  };
  timeOfLastUpdate: string;
  timeOfRecord: string;
  transaction: {
    acquirer: {
      merchantId: string;
    };
    amount: number;
    authenticationStatus: AuthenticationStatus;
    currency: string;
    id: string;
    type: string;
  };
  version: string;
}

/**
 * @description MPGS API payload to pay
 */
export interface IMPGSPayBody {
  sessionId: string;
  orderId: string;
  txn1: string;
  txn2: string;
  currency: string;
  amount: string;
}

/**
 * @description MPGS API response when paying
 */

export interface IMPGSPayResp {
  authentication: {
    '3ds': {
      acsEci: string;
      authenticationToken: string;
      transactionId: string;
    };
    '3ds2': {
      dsTransactionId: string;
      protocolVersion: string;
      transactionStatus: string;
    };
    transactionId: string;
    version: string;
  };
  authorizationResponse: {
    cardSecurityCodeError: string;
    commercialCard: string;
    commercialCardIndicator: string;
    financialNetworkCode: string;
    posData: string;
    posEntryMode: string;
    processingCode: string;
    responseCode: string;
    stan: string;
    transactionIdentifier: string;
  };
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  device: {
    browser: string;
    ipAddress: string;
  };
  gatewayEntryPoint: string;
  merchant: string;
  order: {
    amount: number;
    authenticationStatus: AuthenticationStatus;
    chargeback: {
      amount: number;
      currency: string;
    };
    creationTime: string;
    currency: string;
    id: string;
    lastUpdatedTime: string;
    merchantAmount: number;
    merchantCategoryCode: string;
    merchantCurrency: string;
    status: OrderStatus;
    totalAuthorizedAmount: number;
    totalCapturedAmount: number;
    totalRefundedAmount: number;
  };
  response: {
    acquirerCode: string;
    acquirerMessage: string;
    cardSecurityCode: {
      acquirerCode: string;
      gatewayCode: string;
    };
    gatewayCode: GatewayCode;
  };
  result: ResultResponse;
  sourceOfFunds: {
    provided: {
      card: {
        brand: string;
        expiry: {
          month: string;
          year: string;
        };
        fundingMethod: string;
        number: string;
        scheme: string;
        storedOnFile: string;
      };
    };
    type: string;
  };
  timeOfLastUpdate: string;
  timeOfRecord: string;
  transaction: {
    acquirer: {
      batch: number;
      date: string;
      id: string;
      merchantId: string;
      settlementDate: string;
      timeZone: string;
      transactionId: string;
    };
    amount: number;
    authenticationStatus: AuthenticationStatus;
    authorizationCode: string;
    currency: string;
    id: string;
    receipt: string;
    source: string;
    stan: string;
    terminal: string;
    type: string;
  };
  version: string;
}

@Injectable()
export class MPGSService {
  // axios: Axios: is a service that responsible to comunicate with MPGS API;
  axios: Axios;

  constructor(private readonly configService: ConfigService) {
    // init axios
    this.initAxios();
  }

  /**
   * @description generate auth header
   * @returns auth header
   */
  private generateAuthHeader() {
    // username  of marchant
    const MARCHANT_AUTH_USERNAME = this.configService.get(
      ConfigKeys.MARCHANT_AUTH_USERNAME,
    );
    // password of marchant
    const MARCHANT_AUTH_PASSWORD = this.configService.get(
      ConfigKeys.MARCHANT_AUTH_PASSWORD,
    );
    // generate auth header that will be sent with every request
    const authStr = `${MARCHANT_AUTH_USERNAME}:${MARCHANT_AUTH_PASSWORD}`;
    return 'Basic ' + Buffer.from(authStr).toString('base64');
  }

  /**
   * @description init axios object for NBE config variables in .env file
   * @param headers axios headers
   */
  private initAxios(headers?: Partial<RawAxiosRequestHeaders>) {
    // MPGS API url (SHOULD) end with /marchant/MARCHANT_NAME
    const url = `${this.configService.get(ConfigKeys.NBE_API)}`;
    // init axios object
    this.axios = axios.create({
      transformRequest: axios.defaults.transformRequest,
      transformResponse: axios.defaults.transformResponse,
      baseURL: url,
      headers: {
        Authorization: this.generateAuthHeader(),
        ...headers,
      },
    });
  }

  /**
   * @description create/init a hosted session
   * @returns
   */
  async createSession(): Promise<IMPGCreateSessionResp> {
    const resp = await this.axios.post('/session', {
      session: { authenticationLimit: 25 },
    });
    return resp.data as IMPGCreateSessionResp;
  }

  /**
   * @description update a hosted session with the order data
   */
  async UpdateHostedSessionOrder(
    sessionId: string,
    orderData: IMPGSSessionOrder,
  ) {
    const resp = await this.axios.put(`/session/${sessionId}`, {
      apiOperation: 'UPDATE_SESSION',
      order: {
        currency: orderData.currency,
        id: orderData.id,
        amount: orderData.amount,
      },
    });
    return resp.data as IMPGSUpdateSessionResp;
  }

  /**
   *
   * @param sessionId hosted session id
   * @param  cardData
   */
  async updateSessionCard(sessionId: string, cardData: IMPGSSessionCard) {
    const { cardNumber, expiryMonth, expiryYear, securityCode } = cardData;
    const payload = {
      apiOperation: 'UPDATE_SESSION',
      sourceOfFunds: {
        provided: {
          card: {
            number: cardNumber,
            expiry: {
              month: expiryMonth,
              year: expiryYear,
            },
            securityCode: securityCode,
          },
        },
      },
    };
    const resp = await this.axios.put(`/session/${sessionId}`, payload);
    return resp.data as IMPGSUpdateSessionCardResp;
  }

  /**
   *
   * @param sessionId hosted session id
   * @param  authData data to initiate authentication
   */
  async initSessionAuth(authData: IMPGSInitSessionAuthBody) {
    const { sessionId, orderId, txn1, currency } = authData;
    const payload = {
      apiOperation: 'INITIATE_AUTHENTICATION',
      session: {
        id: sessionId,
      },
      order: {
        currency,
      },
      authentication: {
        acceptVersions: '3DS1,3DS2',
        channel: 'PAYER_BROWSER',
        purpose: 'PAYMENT_TRANSACTION',
      },
    };
    const resp = await this.axios.put(
      `/order/${orderId}/transaction/${txn1}`,
      payload,
    );
    return resp.data as IMPGSInitSessionAuthResp;
  }

  /**
   * @description authenticate payer this method should be recalled agfter thuenticate the payer
   * @param authPayerBody the payload will be sent to MPGS API
   * @param redirectUrl the url that will be used to redirect the payer to after authentication
   */
  async authenticatePayer(
    authPayerBody: IMPGSAuthenticatePayerBody,
    redirectUrl: string,
  ) {
    const { sessionId, orderId, txn1, currency, amount, fname, lname, device } =
      authPayerBody;
    const payload = {
      apiOperation: 'AUTHENTICATE_PAYER',
      order: {
        currency: currency,
        amount: amount,
      },
      session: {
        id: sessionId,
      },
      authentication: {
        redirectResponseUrl: redirectUrl,
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
          '3DSecureChallengeWindowSize':
            device.browserDetails['3DSecureChallengeWindowSize'],
        },
        browser: device.browser,
        ipAddress: device.ipAddress,
      },
    };
    const resp = await this.axios.put(
      `/order/${orderId}/transaction/${txn1}`,
      payload,
    );
    return resp.data as IMPGSAuthenticatePayerResp;
  }

  /**
   * @desciption this method should be called after authenticate the payer
   * @param payBody the payload will be sent to MPGS API when pay the order
   * @returns the response from MPGS API
   */
  async pay(payBody: IMPGSPayBody) {
    const { sessionId, orderId, txn1, txn2, currency, amount } = payBody;
    const payload = {
      apiOperation: 'PAY',
      order: {
        currency: currency,
        amount: amount,
      },
      session: {
        id: sessionId,
      },
      sourceOfFunds: {
        type: 'CARD',
      },
      authentication: {
        transactionId: txn1,
      },
    };
    const resp = await this.axios.put(
      `/order/${orderId}/transaction/${txn2}`,
      payload,
    );
    return resp.data as IMPGSPayResp;
  }
}
