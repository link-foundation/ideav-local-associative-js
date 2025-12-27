---
'ideav-local-associative-js': minor
---

Add comprehensive CI/CD pipeline and code quality tooling

- Add release.yml workflow with test matrix (Node.js, Bun, Deno × Ubuntu, macOS, Windows)
- Add ESLint with Prettier integration and code quality rules
- Add changeset-based versioning and release automation
- Add code duplication detection with jscpd
- Update test-anywhere to v0.8.48 for multi-runtime test support
- Use npm-published lino-env instead of GitHub dependency
- Add proper module exports in src/index.js
- Fix server.mjs to export app and only start when run directly
