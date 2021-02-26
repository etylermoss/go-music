CREATE TABLE 'Media' (
    'resourceID' TEXT NOT NULL PRIMARY KEY,
    'sourceResourceID' TEXT NOT NULL,
    'path' TEXT NOT NULL UNIQUE,
    'size' INTEGER NOT NULL,
    'mimeType' TEXT DEFAULT NULL,
    FOREIGN KEY ("resourceID") REFERENCES "Resource" ("resourceID") ON DELETE CASCADE,
    FOREIGN KEY ("sourceResourceID") REFERENCES "Source" ("resourceID") ON DELETE CASCADE
);