# ideav-local-associative-js

## 0.3.0

### Minor Changes

- f7b8f88: feat: implement full ideav/local feature set

  This release adds comprehensive features from ideav/local using the ILinks interface pattern:
  - **RecursiveLinks API** (`/recursive/*`): Work with nested data structures
    - Create links from nested arrays and objects
    - Convert between data structures and Links Notation
    - Parse and format Links Notation strings
  - **Objects API** (`/objects/*`): Hierarchical object storage compatible with ideav/local
    - CRUD operations for objects with type, parent, ordering, and value attributes
    - List children of objects
    - Reorder objects within their parent
  - **Filtering** (`POST /links/filter`): Query links with powerful filters
    - Text operations: contains, starts with, ends with
    - Numeric operations: equals, range, greater/less than
    - Logical operations: negation, IN list
    - Reference operations: by reference ID
  - **Export/Import** (`GET /export`, `POST /import`): Data portability
    - Links Notation format (native)
    - JSON format
    - CSV format
    - Auto-detection of import format
  - **API Information** (`GET /api`): List all available endpoints

  All new features are built on top of the universal ILinks interface from @link-foundation/links-client.

## 0.2.0

### Minor Changes

- 4369a59: Add @link-foundation/links-client integration with full CRUD API, CLI support, and comprehensive tests

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
