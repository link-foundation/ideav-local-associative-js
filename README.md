# ideav-local-associative-js

Proof of Concept: JavaScript port using Bun, Express, and Links Notation with Link Foundation tools.

Goals (from Issue #1):

- Translate the core ideas from https://github.com/ideav/local to JavaScript.
- Use Bun and Express for the server runtime.
- Use Links Notation for data exchange instead of JSON.
- Use Link Foundation tooling where applicable (link-cli, links-client, lino-env, lino-arguments, test-anywhere).

This PR bootstraps the project with:

- Bun + Express server (`src/server.mjs`).
- Links Notation parser/formatter demo endpoints.
- Lino Env-based configuration (`.lenv`).
- Basic tests (Bun test) and CI workflow.

Run locally

- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Health check: `curl -s localhost:3000/health`
- Parse LN: `curl -s -X POST localhost:3000/parse -H 'Content-Type: text/plain' --data '(status: ok)'`

Configuration (.lenv)

- `server.port: 3000`
- `server.host: 0.0.0.0`

Next steps

- Implement end-to-end operations mirroring ideav/local functionality.
- Integrate `link-cli` process and `@unidel2035/links-client` for data access.
- Adopt `lino-arguments` for CLI entry points when available.
- Expand test coverage using `test-anywhere` patterns and add richer CI.
