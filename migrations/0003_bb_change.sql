-- Migration number: 0003 	 2024-04-27T05:49:15.768Z
CREATE TABLE `bb_change` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER NOT NULL,
  `game_id` INTEGER NOT NULL,
  `value` REAL NOT NULL
);

