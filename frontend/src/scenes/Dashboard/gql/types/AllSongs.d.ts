/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllSongs
// ====================================================

export interface AllSongs_songs_media {
  __typename: "MediaGQL";
  path: string;
  sourceResourceID: string;
}

export interface AllSongs_songs {
  __typename: "SongGQL";
  mediaResourceID: string;
  media: AllSongs_songs_media;
}

export interface AllSongs {
  /**
   * Query all songs the user has access to.Can optionally limit results to songs in a specific source.
   */
  songs: AllSongs_songs[] | null;
}
