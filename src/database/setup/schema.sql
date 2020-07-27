/* --- Users & Authentication --- */

CREATE TABLE IF NOT EXISTS 'User' (
	'user_id' TEXT NOT NULL UNIQUE,
	'username' TEXT NOT NULL UNIQUE
);

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

CREATE TABLE IF NOT EXISTS 'UserDetails' (
	'user_id' TEXT NOT NULL UNIQUE,
	'email' TEXT NOT NULL,
	'real_name' TEXT NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);

/* --- Resources --- */

CREATE TABLE IF NOT EXISTS 'Resource' (
	'resource_id' TEXT NOT NULL PRIMARY KEY,
	'owner_user_id' TEXT NOT NULL,
	FOREIGN KEY ("owner_user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);

/* --- Access Control --- */

CREATE TABLE IF NOT EXISTS 'Group' (
	'group_id' TEXT NOT NULL PRIMARY KEY,
	'owner_user_id' TEXT NOT NULL,
	'name' TEXT NOT NULL UNIQUE,
	'description' TEXT,
	FOREIGN KEY ("owner_user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'UserGroup' (
	'group_id' TEXT NOT NULL PRIMARY KEY,
	'user_id' TEXT NOT NULL,
	FOREIGN KEY ("group_id") REFERENCES "Group" ("group_id") ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'ResourceGroup' (
	'group_id' TEXT NOT NULL PRIMARY KEY,
	'resource_id' TEXT NOT NULL,
	'allowed_operations' INTEGER NOT NULL,
	FOREIGN KEY ("group_id") REFERENCES "Group" ("group_id") ON DELETE CASCADE,
	FOREIGN KEY ("resource_id") REFERENCES "Resource" ("resource_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS 'AdminUser' (
	'user_id' TEXT NOT NULL UNIQUE,
	'priority' INTEGER NOT NULL, /* TODO: turn into UNIX timestamp */
	FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);