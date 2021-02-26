/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface AddSourceInput {
  name: string;
  path: string;
}

export interface SignInInput {
  password: string;
  username: string;
}

export interface SignUpInput {
  details: UserDetailsInput;
  password: string;
  username: string;
}

export interface UserDetailsInput {
  email: string;
  realName: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
