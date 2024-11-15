import { Hono } from "hono";

type Bindings = {
	CACHE: KVNamespace;
	DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

app.get("/:username", async c =>  {
	const username = c.req.param("username");
	const cachedResponse = await c.env.CACHE.get(username, "json");
	
	let repos;
	if (cachedResponse) {
		repos = cachedResponse
	} else {
		const response = await fetch(`https://api.github.com/users/${username}/repos`, {
			headers: {
				"User-Agent": "CF-Worker"
			}
		})
		repos = await response.json();

		if (!Array.isArray(repos)) {
            return c.json({ error: "User not found or API error" }, 404);
        }

		await c.env.CACHE.put(username, JSON.stringify(repos));
	}
	
	const metrics = await calculateMetrics(repos);

    await c.env.DB.prepare(`
        INSERT INTO github_metrics (username, total_stars, total_forks, total_repos, most_used_language)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
            total_stars = excluded.total_stars,
            total_forks = excluded.total_forks,
            total_repos = excluded.total_repos,
            most_used_language = excluded.most_used_language,
            updated_at = CURRENT_TIMESTAMP
    `).bind(
        username,
        metrics.totalStars,
        metrics.totalForks,
        metrics.totalRepos,
        metrics.mostUsedLanguage
    ).run();

	return c.json({
        username,
        metrics,
        repositories: repos
    });	
})

.get("/:username/metrics", async c => {
    const username = c.req.param("username");
    
    const metrics = await c.env.DB.prepare(`
        SELECT * FROM github_metrics 
        WHERE username = ?
        ORDER BY updated_at DESC 
        LIMIT 1
    `).bind(username).first();
    
    if (!metrics) {
        return c.json({ error: "Metrics not found" }, 404);
    }
    
    return c.json(metrics);
});

interface Repository {
    stargazers_count: number;
    forks_count: number;
    language: string;
}

async function calculateMetrics(repos: Repository[]) {
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    
    // Calcula a linguagem mais usada
    const languageCounts = repos.reduce((acc, repo) => {
        if (repo.language) {
            acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const mostUsedLanguage = Object.entries(languageCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
        totalStars,
        totalForks,
        totalRepos: repos.length,
        mostUsedLanguage
    };
}

export default app