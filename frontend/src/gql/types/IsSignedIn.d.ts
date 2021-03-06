/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: IsSignedIn
// ====================================================

export interface IsSignedIn_isSignedIn_details {
  __typename: "UserDetailsGQL";
  email: string;
  realName: string;
}

export interface IsSignedIn_isSignedIn {
  __typename: "UserGQL";
  userID: string;
  username: string;
  adminPriority: number | null;
  details: IsSignedIn_isSignedIn_details | null;
}

export interface IsSignedIn {
  /**
   * Check whether the client is signed in, ensures theauthToken cookie (httpOnly) is present in the database andassociated with a user.
   */
  isSignedIn: IsSignedIn_isSignedIn | null;
}
