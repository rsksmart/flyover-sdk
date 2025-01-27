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
}
