-- Migration number: 0005 	 2024-05-05T03:55:29.496Z
ALTER TABLE games ADD column season_id INTEGER NOT NULL DEFAULT 1;