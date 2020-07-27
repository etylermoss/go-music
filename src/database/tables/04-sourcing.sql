CREATE TABLE IF NOT EXISTS 'Source' (
	'resource_id' TEXT NOT NULL PRIMARY KEY,
	'name' TEXT NOT NULL UNIQUE,
	'path' TEXT NOT NULL UNIQUE,
	'xml_tree' TEXT,
	'scan_previous' INTEGER NOT NULL DEFAULT ( strftime('%s', 'now') ),
	'scan_underway' INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY ("resource_id") REFERENCES "Resource" ("resource_id") ON DELETE CASCADE
);