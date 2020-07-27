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