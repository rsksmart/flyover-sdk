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

import { ChangeStatusRequest } from "./data-contracts";

export namespace Provider {
  /**
   * @description  Changes the status of the provider
   * @name PostChangeStatus
   * @summary Change Provider Status
   * @request POST:/provider/changeStatus
   */
  export namespace PostChangeStatus {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChangeStatusRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostChangeStatusPath = "/provider/changeStatus";

  /**
   * @description  Provider stops being a liquidity provider
   * @name PostResignation
   * @summary Provider resignation
   * @request POST:/provider/resignation
   */
  export namespace PostResignation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostResignationPath = "/provider/resignation";
}
