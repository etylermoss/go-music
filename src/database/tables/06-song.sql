CREATE TABLE IF NOT EXISTS 'Song' (
    'mediaResourceID' TEXT NOT NULL PRIMARY KEY,
    'title' TEXT NOT NULL,
	'year' INTEGER,
	'trackNo' INTEGER,
	'trackOf' INTEGER,
	'diskNo' INTEGER,
	'diskOf' INTEGER,
	'releaseFormat' TEXT,
	'releaseCountry' TEXT,
	'duration' REAL,
	'codec' TEXT,
	'lossless' INTEGER,
    FOREIGN KEY ("mediaResourceID") REFERENCES "Media" ("resourceID") ON DELETE CASCADE
);