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

import { GeneralConfigurationRequest } from "./data-contracts";

export namespace Configuration {
  /**
   * @description  Get all the configurations for the liquidity provider. Included in the management API.
   * @name ConfigurationList
   * @summary Get configurations
   * @request GET:/configuration
   */
  export namespace ConfigurationList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const ConfigurationListPath = "/configuration";

  /**
   * @description  Set general configurations of the server. Included in the management API.
   * @name PostConfiguration
   * @summary Set General Config
   * @request POST:/configuration
   */
  export namespace PostConfiguration {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GeneralConfigurationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostConfigurationPath = "/configuration";
}
