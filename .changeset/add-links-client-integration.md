---
'ideav-local-associative-js': minor
---

Add @link-foundation/links-client integration with full CRUD API, CLI support, and comprehensive tests

### Features

- Add @link-foundation/links-client dependency for link-cli database operations
- Implement REST API endpoints for links CRUD operations (/links)
- Implement ILinks API endpoints compatible with Platform.Data interface (/ilinks)
- Add CLI arguments support via lino-arguments (--port, --host, --db-path)
- Replace lino-env with lino-arguments for unified configuration from CLI args, env vars, and .lenv files
- Add data directory for database storage
- Update README with complete API documentation including CLI options

### CI/CD Pipeline

- Add release.yml workflow with test matrix (Node.js, Bun, Deno × Ubuntu, macOS, Windows)
- Add ESLint with Prettier integration and code quality rules
- Add changeset-based versioning and release automation
- Add code duplication detection with jscpd
- Update test-anywhere to v0.8.48 for multi-runtime test support

### Testing

- Add comprehensive E2E tests for all REST API routes (51 tests total)
- Add tests for /health, /parse, /links CRUD, and /ilinks API endpoints
- Add validation logic tests for request parsing
- Add import tests for dependencies
