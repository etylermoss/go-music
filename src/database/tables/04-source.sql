CREATE TABLE IF NOT EXISTS 'Source' (
	'resourceID' TEXT NOT NULL PRIMARY KEY,
	'name' TEXT NOT NULL UNIQUE,
	'path' TEXT NOT NULL UNIQUE,
	FOREIGN KEY ("resourceID") REFERENCES "Resource" ("resourceID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'Scan' (
	'scanID' TEXT NOT NULL PRIMARY KEY,
	'sourceResourceID' TEXT NOT NULL,
	'startTime' INTEGER NOT NULL,
	'endTime' INTEGER,
	'changesAdd' INTEGER,
	'changesRemove' INTEGER,
	FOREIGN KEY ("sourceResourceID") REFERENCES "Source" ("resourceID") ON DELETE CASCADE
);