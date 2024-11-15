-- Migration number: 0002 	 2024-11-15T22:09:21.951Z

DELETE FROM github_metrics WHERE username = 'gifflet';

INSERT INTO github_metrics (
    username,
    total_stars,
    total_forks,
    total_repos,
    most_used_language,
    updated_at
) VALUES (
    'gifflet',
    38,
    12,
    23,
    'TypeScript',
    DATETIME('2024-01-15 10:00:00')
);
