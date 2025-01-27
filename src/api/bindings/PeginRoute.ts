/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  AcceptPeginRespose,
  AcceptQuoteRequest,
  AddCollateralRequest,
  AddCollateralResponse,
  GetCollateralResponse,
  GetPeginQuoteResponse,
  PeginConfigurationRequest,
  PeginQuoteRequest,
  PeginQuoteStatusDTO,
} from "./data-contracts";

export namespace Pegin {
  /**
   * @description  Accepts Quote
   * @name PostAcceptQuote
   * @summary Accept Quote
   * @request POST:/pegin/acceptQuote
   */
  export namespace PostAcceptQuote {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AcceptQuoteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AcceptPeginRespose;
  }

  export const PostAcceptQuotePath = "/pegin/acceptQuote";

  /**
   * @description  Adds PegIn Collateral
   * @name PostAddCollateral
   * @summary Add PegIn Collateral
   * @request POST:/pegin/addCollateral
   */
  export namespace PostAddCollateral {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddCollateralRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddCollateralResponse;
  }

  export const PostAddCollateralPath = "/pegin/addCollateral";

  /**
   * @description  Get PegIn Collateral
   * @name CollateralList
   * @summary Get PegIn Collateral
   * @request GET:/pegin/collateral
   */
  export namespace CollateralList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCollateralResponse;
  }

  export const CollateralListPath = "/pegin/collateral";

  /**
   * @description  Set the configuration for the Pegin service. Included in the management API.
   * @name PostConfiguration
   * @summary Set Pegin Config
   * @request POST:/pegin/configuration
   */
  export namespace PostConfiguration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PeginConfigurationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostConfigurationPath = "/pegin/configuration";

  /**
   * @description  Gets Pegin Quote
   * @name PostGetQuote
   * @summary Pegin GetQuote
   * @request POST:/pegin/getQuote
   */
  export namespace PostGetQuote {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PeginQuoteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetPeginQuoteResponse;
  }

  export const PostGetQuotePath = "/pegin/getQuote";

  /**
   * @description  Returns the status of an accepted pegin quote
   * @name StatusList
   * @summary GetPeginStatus
   * @request GET:/pegin/status
   */
  export namespace StatusList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Hash of the quote
       * @format string
       */
      quoteHash: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PeginQuoteStatusDTO;
  }

  export const StatusListPath = "/pegin/status";
}
