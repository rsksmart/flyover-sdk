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

import { AddCollateralRequest } from "./data-contracts";

export namespace AddCollateral {
  /**
   * @description  Adds Collateral
   * @name PostAddCollateral
   * @summary Add Collateral
   * @request POST:/addCollateral
   * @secure
   */
  export namespace PostAddCollateral {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddCollateralRequest;
    export type RequestHeaders = {};
    export type ResponseBody = {};
  }

  export const PostAddCollateralPath = "/addCollateral";
}
