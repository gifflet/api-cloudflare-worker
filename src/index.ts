import { Hono } from "hono";
import { cors } from 'hono/cors'

type Bindings = {
	CACHE: KVNamespace;
	DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: false,
}));

app.get("/:username/repositories", async c =>  {
	const username = c.req.param("username")?.toLowerCase();
	const page = parseInt(c.req.query('page') || '1');
	const per_page = parseInt(c.req.query('per_page') || '30');
	
	const cachedResponse = await c.env.CACHE.get(`${username}_${page}_${per_page}`, "json");
	
	let repos;
	let hasNextPage = false;
	let hasPrevPage = false;

	if (cachedResponse && 'repositories' in cachedResponse && 'pagination' in cachedResponse) {
		const { repositories, pagination } = cachedResponse as CachedResponse;
		repos = repositories;
		hasNextPage = pagination.has_next_page;
		hasPrevPage = pagination.has_previous_page;
	} else {
		const response = await fetch(
			`https://api.github.com/users/${username}/repos?page=${page}&per_page=${per_page}`, {
			headers: {
				"User-Agent": "CF-Worker"
			}
		});
		repos = await response.json();

		if (!Array.isArray(repos)) {
			return c.json({ error: "User not found or API error" }, 404);
		}

		// Get pagination information from response headers
		const linkHeader = response.headers.get('Link');
		hasNextPage = linkHeader?.includes('rel="next"') ?? false;
		hasPrevPage = linkHeader?.includes('rel="prev"') ?? false;

		// Cache both repositories and pagination information
		await c.env.CACHE.put(`${username}_${page}_${per_page}`, JSON.stringify({
			repositories: repos,
			pagination: {
				has_next_page: hasNextPage,
				has_previous_page: hasPrevPage
			}
		}));
	}
	
	return c.json({
		username,
		repositories: repos,
		pagination: {
			current_page: page,
			per_page,
			has_next_page: hasNextPage,
			has_previous_page: hasPrevPage
		}
	});	
})

.get("/:username/metrics", async c => {
    const username = c.req.param("username")?.toLowerCase();
    
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
})

.get("/:username/badge", async c => {
    const username = c.req.param("username")?.toLowerCase();
    
    // Try to get cached repositories first
    const cachedRepos = await c.env.CACHE.get(`${username}_repositories`, "json");
    
    let repos;
    if (cachedRepos) {
        repos = cachedRepos;
    } else {
        // Fetch repositories if not cached
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=1024`, {
            headers: {
                "User-Agent": "CF-Worker"
            }
        });
        repos = await response.json();

        if (!Array.isArray(repos)) {
            return c.json({ error: "User not found or API error" }, 404);
        }

        // Cache the repositories for future use
        await c.env.CACHE.put(`${username}_repositories`, JSON.stringify(repos), {
            expirationTtl: 3600 // Cache for 1 hour
        });
    }

    // Calculate metrics
    const metrics = await calculateMetrics(repos);

    // Update metrics in database
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

    // Fetch individual badges
    const badges = await Promise.all([
        fetch(`https://img.shields.io/badge/Most_Used_Language-${metrics.mostUsedLanguage}-blue`),
        fetch(`https://img.shields.io/badge/Stars-${metrics.totalStars}-yellow`),
        fetch(`https://img.shields.io/badge/Forks-${metrics.totalForks}-green`),
        fetch(`https://img.shields.io/badge/Repositories-${metrics.totalRepos}-purple`)
    ]);

    // Get SVG content from each response
    const svgContents = await Promise.all(
        badges.map(response => response.text())
    );

    // Extract width from each SVG
    const widths = svgContents.map(svg => {
        const match = svg.match(/width="([^"]+)"/);
        return match ? parseInt(match[1]) : 80;
    });

    // Calculate total width and positions
    const totalWidth = widths.reduce((sum, width) => sum + width + 4, 0); // 4px spacing between badges
    let currentX = 0;

    // Combine SVGs into a single horizontal row
    const combinedSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20">
            ${svgContents.map((svg, index) => {
                const innerSVG = svg.replace(/<\/?svg[^>]*>/g, '');
                const position = currentX;
                currentX += widths[index] + 2; // Update position for next badge
                return `<g transform="translate(${position}, 0)">${innerSVG}</g>`;
            }).join('')}
        </svg>
    `;

    return new Response(combinedSVG, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=600'
        }
    });
});

interface Repository {
    stargazers_count: number;
    forks_count: number;
    language: string;
}

interface CachedResponse {
    repositories: Repository[];
    pagination: {
        has_next_page: boolean;
        has_previous_page: boolean;
    };
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