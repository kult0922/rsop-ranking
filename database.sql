PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO d1_migrations VALUES(1,'0001_users.sql','2024-04-27 05:27:24');
INSERT INTO d1_migrations VALUES(2,'0002_games.sql','2024-04-27 05:39:49');
INSERT INTO d1_migrations VALUES(3,'0003_bb_change.sql','2024-04-27 09:03:37');
CREATE TABLE `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL
);
INSERT INTO users VALUES(1,'かずま');
INSERT INTO users VALUES(2,'まこと');
INSERT INTO users VALUES(3,'りつや');
INSERT INTO users VALUES(4,'かいり');
INSERT INTO users VALUES(5,'にっこう');
INSERT INTO users VALUES(6,'せり');
INSERT INTO users VALUES(7,'とみー');
INSERT INTO users VALUES(8,'ふじいけ');
CREATE TABLE `games` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL,
  `date` DATE NOT NULL
);
INSERT INTO games VALUES(1,'RSOP S2-1','2024-03-29');
INSERT INTO games VALUES(2,'RSOP S2-2','2024-04-24');
CREATE TABLE `bb_change` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER NOT NULL,
  `game_id` INTEGER NOT NULL,
  `value` REAL NOT NULL
);
INSERT INTO bb_change VALUES(1,1,1,-28);
INSERT INTO bb_change VALUES(2,2,1,-97.5);
INSERT INTO bb_change VALUES(3,3,1,119.5);
INSERT INTO bb_change VALUES(4,4,1,52);
INSERT INTO bb_change VALUES(5,6,1,-29);
INSERT INTO bb_change VALUES(6,7,1,-17);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('d1_migrations',3);
INSERT INTO sqlite_sequence VALUES('users',8);
INSERT INTO sqlite_sequence VALUES('games',2);
INSERT INTO sqlite_sequence VALUES('bb_change',6);
