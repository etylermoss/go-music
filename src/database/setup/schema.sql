/* --- Users & Authentication --- */

CREATE TABLE IF NOT EXISTS 'Users' (
	'user_id' TEXT NOT NULL UNIQUE,
	'username' TEXT NOT NULL UNIQUE
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

CREATE TABLE IF NOT EXISTS 'UserDetails' (
	'user_id' TEXT NOT NULL UNIQUE,
	'email' TEXT NOT NULL,
	'real_name' TEXT NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

/* --- Resources --- */

CREATE TABLE IF NOT EXISTS 'Resources' (
	'resource_id' TEXT NOT NULL PRIMARY KEY,
	'user_id' TEXT NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

/* --- Access Control --- */

CREATE TABLE IF NOT EXISTS 'AccessGroups' (
	'group_id' TEXT NOT NULL PRIMARY KEY,
	'user_id' TEXT NOT NULL,
	'name' TEXT NOT NULL UNIQUE,
	'description' TEXT,
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'UserAccessGroups' (
	'group_id' TEXT NOT NULL PRIMARY KEY,
	'user_id' TEXT NOT NULL,
	'allowed_operations' INTEGER,
	FOREIGN KEY ("group_id") REFERENCES "AccessGroups" ("group_id") ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'ResourceAccessGroups' (
	'group_id' TEXT NOT NULL PRIMARY KEY,
	'resource_id' TEXT NOT NULL,
	'allowed_operations' INTEGER NOT NULL,
	FOREIGN KEY ("group_id") REFERENCES "AccessGroups" ("group_id") ON DELETE CASCADE,
	FOREIGN KEY ("resource_id") REFERENCES "Resources" ("resource_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'AdminUsers' (
	'user_id' TEXT NOT NULL UNIQUE,
	'priority' INTEGER NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE
);