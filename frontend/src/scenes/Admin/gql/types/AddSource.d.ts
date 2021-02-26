/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddSourceInput } from "./../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: AddSource
// ====================================================

export interface AddSource_addSource {
  __typename: "SourceGQL";
  resourceID: string;
  name: string;
  path: string;
}

export interface AddSource {
  /**
   * Add a new source, must be an admin.The source is not scanned automatically.
   */
  addSource: AddSource_addSource | null;
}

export interface AddSourceVariables {
  data: AddSourceInput;
}
