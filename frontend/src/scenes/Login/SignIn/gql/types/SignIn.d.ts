/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SignInInput } from "./../../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: SignIn
// ====================================================

export interface SignIn_signIn_details {
  __typename: "UserDetailsGQL";
  realName: string;
  email: string;
}

export interface SignIn_signIn {
  __typename: "UserGQL";
  userID: string;
  username: string;
  adminPriority: number | null;
  details: SignIn_signIn_details | null;
}

export interface SignIn {
  /**
   * Sign into the application, if the supplied credentialsare correct, the authToken httpOnly cookie is set.
   */
  signIn: SignIn_signIn | null;
}

export interface SignInVariables {
  data: SignInInput;
}
