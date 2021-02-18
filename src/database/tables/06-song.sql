CREATE TABLE 'Song' (
    'media_resource_id' TEXT NOT NULL PRIMARY KEY,
    FOREIGN KEY ("media_resource_id") REFERENCES "Media" ("resource_id") ON DELETE CASCADE
);