CREATE TABLE `schedule_candidates` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `event_id` INTEGER NOT NULL,
  `date` TEXT NOT NULL,
  FOREIGN KEY(event_id) REFERENCES schedule_events(id)
);
