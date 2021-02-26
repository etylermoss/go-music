/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ScanSource
// ====================================================

export interface ScanSource {
  /**
   * Scans the given source, returns success.Must be admin.
   */
  scanSource: boolean;
}

export interface ScanSourceVariables {
  resourceID: string;
}
