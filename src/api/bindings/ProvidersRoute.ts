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

import { AvailableLiquidityDTO, ChangeStatusRequest, ProviderDetailResponse } from "./data-contracts";

export namespace Providers {
  /**
   * @description  Changes the status of the provider
   * @name PostChangeStatus
   * @summary Change Provider Status
   * @request POST:/providers/changeStatus
   */
  export namespace PostChangeStatus {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChangeStatusRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostChangeStatusPath = "/providers/changeStatus";

  /**
   * @description  Returns the details of the provider that manages this instance of LPS
   * @name DetailsList
   * @summary Provider detail
   * @request GET:/providers/details
   */
  export namespace DetailsList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ProviderDetailResponse;
  }

  export const DetailsListPath = "/providers/details";

  /**
   * @description  Fetches the available liquidity for both PegIn and PegOut operations.
   * @name LiquidityList
   * @summary Fetch Available Liquidity
   * @request GET:/providers/liquidity
   */
  export namespace LiquidityList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AvailableLiquidityDTO;
  }

  export const LiquidityListPath = "/providers/liquidity";

  /**
   * @description  Provider stops being a liquidity provider
   * @name PostResignation
   * @summary Provider resignation
   * @request POST:/providers/resignation
   */
  export namespace PostResignation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostResignationPath = "/providers/resignation";

  /**
   * @description  Withdraw PegIn collateral of a resigned LP
   * @name PostWithdrawCollateral
   * @summary Withdraw PegIn Collateral
   * @request POST:/providers/withdrawCollateral
   */
  export namespace PostWithdrawCollateral {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostWithdrawCollateralPath = "/providers/withdrawCollateral";
}
