

**Github Stats Cloudflare Worker**
=====================

**Table of Contents**
-----------------

1. [Overview 🚀](#overview-)
2. [Features 🎉](#features-)
3. [Getting Started 📊](#getting-started-)
4. [Usage 💻](#usage-)
5. [Configuration 🔧](#configuration-)
6. [Wrangler Setup 📚](#wrangler-setup-)

**Overview 🚀**
------------

This project provides a simple API for retrieving GitHub user statistics, built using Cloudflare Workers and Hono. The API caches responses to reduce the number of requests made to the GitHub API.

**Features 🎉**
------------

* Retrieves GitHub user statistics, including repository information
* Caches responses to reduce the number of requests made to the GitHub API
* Built using Cloudflare Workers and Hono for high performance and scalability

**Getting Started 📊**
-------------------

### Prerequisites

* Node.js (version 14 or higher)
* npm (version 6 or higher)
* Cloudflare Workers CLI (version 1.0.0 or higher)

### Installation

1. Clone the repository: `git clone https://github.com/gifflet/github-stats-cloudflare-worker`
2. Install dependencies: `npm install`
3. Configure the project: `cp wrangler.toml wrangler.toml.example` and update the `wrangler.toml` file with your Cloudflare API credentials

**Usage 💻**
---------

### API Endpoints

#### Get User Repositories
* `GET /:username/repositories`: Retrieves paginated GitHub repositories for the specified username
* Query Parameters:
  * `page`: Page number (default: 1)
  * `per_page`: Items per page (default: 30)
* Example: `curl https://your-worker-url.com/gifflet/repositories?page=1&per_page=30`

#### Get User Metrics
* `GET /:username/metrics`: Retrieves cached GitHub metrics for the specified username
* Example: `curl https://your-worker-url.com/gifflet/metrics`

#### Get User Badge
* `GET /:username/badge`: Generates a dynamic SVG badge with user statistics
* Example: 
  * Usage in markdown: `![GitHub Stats](https://your-worker-url.com/gifflet/badge)`
  * Direct access: `curl https://your-worker-url.com/gifflet/badge`

### Response Examples

#### Repositories Endpoint
```json
{
  "username": "gifflet",
  "repositories": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 30,
    "has_next_page": true,
    "has_previous_page": false
  }
}
```

#### Metrics Endpoint
```json
{
  "username": "gifflet",
  "total_stars": 38,
  "total_forks": 12,
  "total_repos": 23,
  "most_used_language": "TypeScript",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Configuration 🔧**
----------------

### Environment Variables

* `CACHE`: The name of the KV namespace used for caching responses

### Wrangler Configuration

* `wrangler.toml`: Configure the project with your Cloudflare API credentials and KV namespace settings

**Wrangler Setup 📚**
----------------------

### Create a new KV namespace

* `npx wrangler kv:namespace create <NAMESPACE_NAME>`: Creates a new KV namespace for caching responses.
* Example: `npx wrangler kv:namespace create github-stats-api-cache`

### Configure the KV namespace

* `npx wrangler kv:namespace configure <NAMESPACE_NAME> --binding <BINDING_NAME>`: Configures the KV namespace with a binding name.
* Example: `npx wrangler kv:namespace configure github-stats-api-cache --binding CACHE`

### Create a D1 Database

* `npx wrangler d1 create <DATABASE_NAME>`: Creates a new D1 database.
* Example: `npx wrangler d1 create github-metrics`

### Create and Apply Migrations

1. Create a migration file:
* `npx wrangler d1 migrations create <DATABASE_NAME> <MESSAGE>`
* Example: `npx wrangler d1 migrations create github_metrics create-tables`

2. Apply migrations to the remote database:
* `npx wrangler d1 migrations apply <DATABASE_NAME>`: Applies all pending migrations to your database.
* Example: `npx wrangler d1 migrations apply github_metrics --remote`

    > If you want to execute migrations locally (for development), you can use the following command:
    * `npx wrangler d1 migrations apply <DATABASE_NAME> --local`: Applies migrations to local D1 database.
    * Example: `npx wrangler d1 migrations apply github_metrics --local`

### Query D1 Database

* `npx wrangler d1 execute <DATABASE_NAME> --command "<SQL_QUERY>"`: Executes SQL commands on your D1 database.
* Example: `npx wrangler d1 execute github_metrics --command "SELECT * FROM github_metrics"`

You can also execute queries locally by adding the `--local` flag:
* Example: `npx wrangler d1 execute github_metrics --local --command "SELECT * FROM github_metrics"`
