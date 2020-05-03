CREATE TABLE IF NOT EXISTS 'SourceDirs' (
	'path' TEXT NOT NULL UNIQUE,
	'xml_tree' TEXT,
	'enabled' INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS 'Users' (
	'user_id' TEXT NOT NULL UNIQUE,
	'username' TEXT NOT NULL UNIQUE,
	'email' TEXT NOT NULL,
	'real_name' TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS 'UserPasswords' (
	'user_id' TEXT NOT NULL UNIQUE,
	'salt' BLOB NOT NULL UNIQUE,
	'hash' BLOB NOT NULL UNIQUE,
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'UserAuthTokens' (
	'user_id' TEXT NOT NULL,
	'token' TEXT NOT NULL UNIQUE,
	'creation_time' INTEGER NOT NULL DEFAULT ( strftime('%s', 'now') ),
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);