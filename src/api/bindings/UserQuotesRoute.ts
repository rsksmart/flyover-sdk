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

import { DepositEventDTO } from "./data-contracts";

export namespace UserQuotes {
  /**
   * @description  Returns user quotes for address.
   * @name UserQuotesList
   * @summary GetUserQuotes
   * @request GET:/userQuotes
   */
  export namespace UserQuotesList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * User Quote Request Details
       * @format string
       */
      address: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DepositEventDTO;
  }

  export const UserQuotesListPath = "/userQuotes";
}
