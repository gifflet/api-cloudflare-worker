import { Hono } from "hono";

type Bindings = {
	CACHE: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>();

app.get("/:username", async c =>  {
	const username = c.req.param("username");
	const cachedResponse = await c.env.CACHE.get(username, "json");
	
	if (cachedResponse) {
		return c.json(cachedResponse)
	}
	
	const response = await fetch(`https://api.github.com/users/${username}/repos`, {
		headers: {
			"User-Agent": "CF-Worker"
		}
	})

	const data = await response.json();
	await c.env.CACHE.put(username, JSON.stringify(data));
	return c.json(data);	
});

export default app