CREATE TABLE `schedule_responses` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `event_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `candidate_id` INTEGER NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'ok',
  FOREIGN KEY(event_id) REFERENCES schedule_events(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(candidate_id) REFERENCES schedule_candidates(id),
  UNIQUE(user_id, candidate_id)
);
