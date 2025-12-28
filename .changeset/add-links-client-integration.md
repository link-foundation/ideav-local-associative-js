---
'ideav-local-associative-js': minor
---

Add @link-foundation/links-client integration with full CRUD API and CI/CD pipeline

### Features

- Add @link-foundation/links-client dependency for link-cli database operations
- Implement REST API endpoints for links CRUD operations (/links)
- Implement ILinks API endpoints compatible with Platform.Data interface (/ilinks)
- Add data directory for database storage
- Update configuration to support db.path setting
- Update README with complete API documentation

### CI/CD Pipeline

- Add release.yml workflow with test matrix (Node.js, Bun, Deno × Ubuntu, macOS, Windows)
- Add ESLint with Prettier integration and code quality rules
- Add changeset-based versioning and release automation
- Add code duplication detection with jscpd
- Update test-anywhere to v0.8.48 for multi-runtime test support

### Testing

- Add comprehensive tests for links-notation parsing
- Add import tests for dependencies
