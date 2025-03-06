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

import { ServerInfoDTO } from "./data-contracts";

export namespace Version {
  /**
   * @description  Returns the server version and revision
   * @name VersionList
   * @summary Get server version
   * @request GET:/version
   */
  export namespace VersionList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ServerInfoDTO;
  }

  export const VersionListPath = "/version";
}
