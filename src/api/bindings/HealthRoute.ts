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

import { HealthResponse } from "./data-contracts";

export namespace Health {
  /**
   * @description  Returns server health.
   * @name HealthList
   * @summary Health
   * @request GET:/health
   */
  export namespace HealthList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthResponse;
  }

  export const HealthListPath = "/health";
}
