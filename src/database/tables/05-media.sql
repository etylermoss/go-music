CREATE TABLE 'Media' (
    'resource_id' TEXT NOT NULL PRIMARY KEY,
    'source_resource_id' TEXT NOT NULL,
    'path' TEXT NOT NULL UNIQUE,
    'size' INTEGER NOT NULL,
    'mime_type' TEXT DEFAULT NULL,
    FOREIGN KEY ("resource_id") REFERENCES "Resource" ("resource_id") ON DELETE CASCADE,
    FOREIGN KEY ("source_resource_id") REFERENCES "Source" ("resource_id") ON DELETE CASCADE
);