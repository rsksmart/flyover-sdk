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

import { LiquidityProvider } from "./data-contracts";

export namespace GetProviders {
  /**
   * @description  Returns a list of providers.
   * @name GetProvidersList
   * @summary Get Providers
   * @request GET:/getProviders
   */
  export namespace GetProvidersList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = LiquidityProvider;
  }

  export const GetProvidersListPath = "/getProviders";
}
