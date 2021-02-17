CREATE TABLE IF NOT EXISTS 'Source' (
	'resource_id' TEXT NOT NULL PRIMARY KEY,
	'name' TEXT NOT NULL UNIQUE,
	'path' TEXT NOT NULL UNIQUE,
	FOREIGN KEY ("resource_id") REFERENCES "Resource" ("resource_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'Scan' (
	'scan_id' TEXT NOT NULL PRIMARY KEY,
	'source_resource_id' TEXT NOT NULL,
	'start_timestamp' INTEGER NOT NULL,
	'end_timestamp' INTEGER,
	'changes' INTEGER,
	FOREIGN KEY ("source_resource_id") REFERENCES "Source" ("resource_id") ON DELETE CASCADE
);