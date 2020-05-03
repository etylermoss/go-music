/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SignUpInput } from "./../../../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: SignUp
// ====================================================

export interface SignUp_signUp_user {
  __typename: "User";
  user_id: string;
  username: string;
  email: string;
  real_name: string;
}

export interface SignUp_signUp {
  __typename: "AuthResponse";
  success: boolean;
  user: SignUp_signUp_user | null;
}

export interface SignUp {
  /**
   * Sign up, creating a new user/account, signs in automatically.
   */
  signUp: SignUp_signUp;
}

export interface SignUpVariables {
  data: SignUpInput;
}
