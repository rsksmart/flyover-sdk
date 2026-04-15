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

import { TrustedAccountRequest } from "./data-contracts";

export namespace Management {
  /**
   * @description  Serves the static site for the Management UI
   * @name ManagementList
   * @summary Management Interface
   * @request GET:/management
   */
  export namespace ManagementList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const ManagementListPath = "/management";

  /**
   * @description  Set new credentials to log into the Management API
   * @name PostCredentials
   * @summary Set Login Credentials
   * @request POST:/management/credentials
   */
  export namespace PostCredentials {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostCredentialsPath = "/management/credentials";

  /**
   * @description  Authenticate to start a Management API session
   * @name PostLogin
   * @summary Management Login
   * @request POST:/management/login
   */
  export namespace PostLogin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostLoginPath = "/management/login";

  /**
   * @description  Logout from the Management API session
   * @name PostLogout
   * @summary Management Logout
   * @request POST:/management/logout
   */
  export namespace PostLogout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostLogoutPath = "/management/logout";

  /**
   * @description  Deletes a trusted account
   * @name DeleteTrustedAccounts
   * @summary Delete Trusted Account
   * @request DELETE:/management/trusted-accounts
   */
  export namespace DeleteTrustedAccounts {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Address of the trusted account to delete
       * @format string
       */
      address: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const DeleteTrustedAccountsPath = "/management/trusted-accounts";

  /**
   * @description  Returns all trusted accounts
   * @name TrustedAccountsList
   * @summary Get Trusted Accounts
   * @request GET:/management/trusted-accounts
   */
  export namespace TrustedAccountsList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const TrustedAccountsListPath = "/management/trusted-accounts";

  /**
   * @description  Adds a new trusted account
   * @name PostTrustedAccounts
   * @summary Add Trusted Account
   * @request POST:/management/trusted-accounts
   */
  export namespace PostTrustedAccounts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrustedAccountRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PostTrustedAccountsPath = "/management/trusted-accounts";

  /**
   * @description  Updates an existing trusted account
   * @name PutTrustedAccounts
   * @summary Update Trusted Account
   * @request PUT:/management/trusted-accounts
   */
  export namespace PutTrustedAccounts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TrustedAccountRequest;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  export const PutTrustedAccountsPath = "/management/trusted-accounts";
}
