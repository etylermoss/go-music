/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateSourceInput } from "./../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: CreateSource
// ====================================================

export interface CreateSource_createSource {
  __typename: "SourceGQL";
  resourceID: string;
  name: string;
  path: string;
}

export interface CreateSource {
  /**
   * Add a new source, must be an admin.The source is not scanned automatically.
   */
  createSource: CreateSource_createSource | null;
}

export interface CreateSourceVariables {
  data: CreateSourceInput;
}
