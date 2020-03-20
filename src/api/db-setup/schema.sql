CREATE TABLE IF NOT EXISTS "sourceDirs" (
	/* rowid automatically created */
	"id" INTEGER,
	"path" TEXT NOT NULL UNIQUE,
	"xmlTree" TEXT,
	"enabled" INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY("id")
);