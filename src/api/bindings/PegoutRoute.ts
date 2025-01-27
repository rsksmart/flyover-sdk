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
  AcceptPegoutResponse,
  AcceptQuoteRequest,
  AddCollateralRequest,
  AddCollateralResponse,
  GetCollateralResponse,
  GetPegoutQuoteResponse,
  PegoutConfigurationRequest,
  PegoutQuoteRequest,
  PegoutQuoteStatusDTO,
} from "./data-contracts";

export namespace Pegout {
  /**
   * @description  Accepts Quote Pegout
   * @name PostAcceptQuote
   * @summary Accept Quote Pegout
   * @request POST:/pegout/acceptQuote
   */
  export namespace PostAcceptQuote {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AcceptQuoteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AcceptPegoutResponse;
  }

  export const PostAcceptQuotePath = "/pegout/acceptQuote";

  /**
   * @description  Adds PegOut Collateral
   * @name PostAddCollateral
   * @summary Add PegOut Collateral
   * @request POST:/pegout/addCollateral
   */
  export namespace PostAddCollateral {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddCollateralRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddCollateralResponse;
  }

  export const PostAddCollateralPath = "/pegout/addCollateral";

  /**
   * @description  Get PegOut Collateral
   * @name CollateralList
   * @summary Get PegOut Collateral
   * @request GET:/pegout/collateral
   */
  export namespace CollateralList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCollateralResponse;
  }

  export const CollateralListPath = "/pegout/collateral";

  /**
   * @description  Set the configuration for the Pegout service. Included in the management API.
   * @name PostConfiguration
   * @summary Set Pegout Config
   * @request POST:/pegout/configuration
   */
  export namespace PostConfiguration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PegoutConfigurationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostConfigurationPath = "/pegout/configuration";

  /**
   * @description  Gets Pegout Quote
   * @name PostGetQuotes
   * @summary Pegout GetQuote
   * @request POST:/pegout/getQuotes
   */
  export namespace PostGetQuotes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PegoutQuoteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetPegoutQuoteResponse;
  }

  export const PostGetQuotesPath = "/pegout/getQuotes";

  /**
   * @description  Returns the status of an accepted pegout quote
   * @name StatusList
   * @summary GetPegoutStatus
   * @request GET:/pegout/status
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
    export type ResponseBody = PegoutQuoteStatusDTO;
  }

  export const StatusListPath = "/pegout/status";
}
