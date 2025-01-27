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

import { GetCollateralResponse } from "./data-contracts";

export namespace Collateral {
  /**
   * @description  Get Collateral
   * @name CollateralDetail
   * @summary Get Collateral
   * @request GET:/collateral/{address}
   * @secure
   */
  export namespace CollateralDetail {
    export type RequestParams = {
      /**
       * Liquidity provider address
       * @format string
       */
      address: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCollateralResponse;
  }

  export const CollateralDetailPath = "/collateral/{address}";
}
