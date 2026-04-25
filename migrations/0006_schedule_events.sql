CREATE TABLE `schedule_events` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL,
  `created_at` TEXT DEFAULT (datetime('now'))
);
