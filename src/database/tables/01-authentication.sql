CREATE TABLE IF NOT EXISTS 'UserPassword' (
	'user_id' TEXT NOT NULL UNIQUE,
	'salt' BLOB NOT NULL UNIQUE,
	'hash' BLOB NOT NULL UNIQUE,
	FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'UserAuthToken' (
	'user_id' TEXT NOT NULL,
	'token' TEXT NOT NULL UNIQUE,
	'creation_time' INTEGER NOT NULL DEFAULT ( strftime('%s', 'now') ),
	FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);