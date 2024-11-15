-- Migration number: 0001 	 2024-11-15T21:43:58.345Z
DROP TABLE IF EXISTS github_metrics;

CREATE TABLE github_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    total_stars INTEGER,
    total_forks INTEGER,
    total_repos INTEGER,
    most_used_language TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
