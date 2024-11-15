

**API Cloudflare Worker**
=====================

**Table of Contents**
-----------------

1. [Overview 🚀](#overview)
2. [Features 🎉](#features)
3. [Getting Started 📊](#getting-started)
4. [Usage 💻](#usage)
5. [Configuration 🔧](#configuration)
6. [Wrangler Setup 📚](#wrangler-setup)

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

1. Clone the repository: `git clone https://github.com/gifflet/api-cloudflare-worker`
2. Install dependencies: `npm install`
3. Configure the project: `cp wrangler.toml wrangler.toml.example` and update the `wrangler.toml` file with your Cloudflare API credentials

**Usage 💻**
---------

### API Endpoints

* `GET /:username`: Retrieves GitHub user statistics for the specified username

### Example Usage

* `curl https://your-worker-url.com/your-username`

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