/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllSources
// ====================================================

export interface AllSources_sources {
  __typename: "SourceGQL";
  resourceID: string;
  name: string;
  path: string;
}

export interface AllSources {
  /**
   * Query all sources, returns those which the user haspermission to access.
   */
  sources: AllSources_sources[] | null;
}
