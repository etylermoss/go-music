CREATE TABLE IF NOT EXISTS 'Artwork' (
    'mediaResourceID' TEXT NOT NULL PRIMARY KEY,
    FOREIGN KEY ("mediaResourceID") REFERENCES "Media" ("resourceID") ON DELETE CASCADE
);