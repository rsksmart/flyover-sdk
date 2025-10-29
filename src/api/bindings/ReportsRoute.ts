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

import { GetTransactionsResponse, SummaryResultDTO } from "./data-contracts";

export namespace Reports {
  /**
   * @description  Get the asset information for the LPS.
   * @name AssetsList
   * @summary Get asset Reports
   * @request GET:/reports/assets
   */
  export namespace AssetsList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const AssetsListPath = "/reports/assets";

  /**
   * @description  Get the last pegins on the API. Included in the management API.
   * @name PeginList
   * @summary Get Pegin Reports
   * @request GET:/reports/pegin
   */
  export namespace PeginList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Start date for the report. Supports YYYY-MM-DD (expands to full day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      startDate: string;
      /**
       * End date for the report. Supports YYYY-MM-DD (expands to end of day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      endDate: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PeginListPath = "/reports/pegin";

  /**
   * @description  Get the last pegouts on the API. Included in the management API.
   * @name PegoutList
   * @summary Get Pegout Reports
   * @request GET:/reports/pegout
   */
  export namespace PegoutList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Start date for the report. Supports YYYY-MM-DD (expands to full day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      startDate: string;
      /**
       * End date for the report. Supports YYYY-MM-DD (expands to end of day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      endDate: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PegoutListPath = "/reports/pegout";

  /**
   * @description  Get the revenue for the specified period.
   * @name RevenueList
   * @summary Get revenue Reports
   * @request GET:/reports/revenue
   */
  export namespace RevenueList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Start date for the report. Supports YYYY-MM-DD (expands to full day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      startDate: string;
      /**
       * End date for the report. Supports YYYY-MM-DD (expands to end of day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      endDate: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const RevenueListPath = "/reports/revenue";

  /**
   * @description  Returns financial data for a given period
   * @name SummariesList
   * @summary Summaries
   * @request GET:/reports/summaries
   */
  export namespace SummariesList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Start date in YYYY-MM-DD format
       * @format string
       */
      startDate: string;
      /**
       * End date in YYYY-MM-DD format
       * @format string
       */
      endDate: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SummaryResultDTO;
  }

  export const SummariesListPath = "/reports/summaries";

  /**
   * @description  Get a paginated list of individual transactions of a specific type processed by the liquidity provider within a specified time period
   * @name TransactionsList
   * @summary Get Transaction Reports
   * @request GET:/reports/transactions
   */
  export namespace TransactionsList {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Transaction type filter: 'pegin' or 'pegout'
       * @format string
       */
      type: string;
      /**
       * Start date for the report. Supports YYYY-MM-DD (expands to full day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      startDate?: string;
      /**
       * End date for the report. Supports YYYY-MM-DD (expands to end of day) or ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
       * @format string
       */
      endDate?: string;
      /**
       * Page number to retrieve (1-indexed, default: 1)
       * @format int64
       */
      page?: number;
      /**
       * Number of transactions per page (max: 100, default: 10)
       * @format int64
       */
      perPage?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTransactionsResponse;
  }

  export const TransactionsListPath = "/reports/transactions";
}
