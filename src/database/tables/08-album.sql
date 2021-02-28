CREATE TABLE IF NOT EXISTS 'Album' (
    'resourceID' TEXT NOT NULL PRIMARY KEY,
    'name' TEXT NOT NULL UNIQUE,
    FOREIGN KEY ("resourceID") REFERENCES "Resource" ("resourceID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'AlbumSong' (
    'songMediaResourceID' TEXT NOT NULL PRIMARY KEY,
    'albumResourceID' TEXT NOT NULL,
    FOREIGN KEY ("songMediaResourceID") REFERENCES "Song" ("mediaResourceID") ON DELETE CASCADE,
    FOREIGN KEY ("albumResourceID") REFERENCES "Album" ("resourceID") ON DELETE CASCADE
);