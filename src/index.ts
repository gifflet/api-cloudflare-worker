import { Hono } from "hono";

type Bindings = {}

const app = new Hono<{ Bindings: Bindings }>();

app.get("/:username", async c =>  {
	const username = c.req.param("username");
	const response = await fetch(`https://api.github.com/users/${username}/repos`, {
		headers: {
			"User-Agent": "CF-Worker"
		}
	})
	const data = await response.json();
	return c.json(data);
});

export default app