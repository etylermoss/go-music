/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SignUpInput } from "./../../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: SignUp
// ====================================================

export interface SignUp_signUp_details {
  __typename: "UserDetails";
  email: string;
  real_name: string;
}

export interface SignUp_signUp {
  __typename: "User";
  user_id: string;
  username: string;
  details: SignUp_signUp_details | null;
}

export interface SignUp {
  /**
   * Sign up, creating a new user/account, and signing inthe user automatically. The first account created is automaticallyset as an admin.
   */
  signUp: SignUp_signUp | null;
}

export interface SignUpVariables {
  data: SignUpInput;
}
