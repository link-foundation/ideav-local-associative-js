---
"ideav-local-associative-js": minor
---

feat: implement full ideav/local feature set

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
