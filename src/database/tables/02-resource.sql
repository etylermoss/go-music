CREATE TABLE IF NOT EXISTS 'Resource' (
	'resource_id' TEXT NOT NULL PRIMARY KEY,
	'owner_user_id' TEXT NOT NULL,
	FOREIGN KEY ("owner_user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE
);