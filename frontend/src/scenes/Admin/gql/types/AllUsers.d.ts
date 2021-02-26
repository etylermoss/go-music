/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllUsers
// ====================================================

export interface AllUsers_users_details {
  __typename: "UserDetailsGQL";
  email: string;
  realName: string;
}

export interface AllUsers_users {
  __typename: "UserGQL";
  userID: string;
  username: string;
  adminPriority: number | null;
  details: AllUsers_users_details | null;
}

export interface AllUsers {
  /**
   * Query all users, must be an admin.
   */
  users: AllUsers_users[] | null;
}
