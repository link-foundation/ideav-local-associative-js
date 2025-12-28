# ideav-local-associative-js

JavaScript port of [IdeaV Local](https://github.com/ideav/local) using Bun, Express, and Links Notation with Link Foundation tools.

## Features

- **Bun + Express server** with Links Notation endpoints
- **Full CRUD API** for link database operations via `@link-foundation/links-client`
- **ILinks API** compatible with Platform.Data interface
- **lino-env** configuration via `.lenv` file
- **Cross-runtime testing** with `test-anywhere`

## Prerequisites

Install link-cli globally (requires .NET):

```bash
dotnet tool install --global clink
```

## Installation

```bash
bun install
# or
npm install
```

## Running the Server

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run start
```

## API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
# Response: (status: ok)
```

### Parse Links Notation

```bash
curl -X POST http://localhost:3000/parse \
  -H 'Content-Type: text/plain' \
  --data '(status: ok)'
```

### Links CRUD API

All responses use Links Notation format: `(id: source target)`

**Create a link:**

```bash
# Using Links Notation
curl -X POST http://localhost:3000/links \
  -H 'Content-Type: text/plain' \
  --data '(100 200)'

# Using JSON
curl -X POST http://localhost:3000/links \
  -H 'Content-Type: application/json' \
  --data '{"source": 100, "target": 200}'
# Response: (1: 100 200)
```

**Read all links:**

```bash
curl http://localhost:3000/links
# Response:
# (1: 100 200)
# (2: 300 400)
```

**Read a specific link:**

```bash
curl http://localhost:3000/links/1
# Response: (1: 100 200)
```

**Update a link:**

```bash
curl -X PUT http://localhost:3000/links/1 \
  -H 'Content-Type: application/json' \
  --data '{"source": 100, "target": 500}'
# Response: (1: 100 500)
```

**Delete a link:**

```bash
curl -X DELETE http://localhost:3000/links/1
# Response: (deleted: ok)
```

### ILinks API (Platform.Data Compatible)

Advanced API compatible with the Platform.Data ILinks interface.

**Count links:**

```bash
curl -X POST http://localhost:3000/ilinks/count \
  -H 'Content-Type: application/json' \
  --data '{"restriction": null}'
# Response: (count: 5)
```

**Iterate through links:**

```bash
curl -X POST http://localhost:3000/ilinks/each \
  -H 'Content-Type: application/json' \
  --data '{"restriction": [100, 0]}'
# Response: All links with source=100
```

**Create via ILinks:**

```bash
curl -X POST http://localhost:3000/ilinks/create \
  -H 'Content-Type: application/json' \
  --data '{"substitution": [100, 200]}'
# Response: (1: 100 200)
```

**Update via ILinks:**

```bash
curl -X POST http://localhost:3000/ilinks/update \
  -H 'Content-Type: application/json' \
  --data '{"restriction": [1], "substitution": [100, 500]}'
# Response: (1: 100 500)
```

**Delete via ILinks:**

```bash
curl -X POST http://localhost:3000/ilinks/delete \
  -H 'Content-Type: application/json' \
  --data '{"restriction": [1]}'
# Response: (deleted: 1)
```

## Configuration

Configuration is stored in `.lenv` using Links Notation:

```
server.port: 3000
server.host: 0.0.0.0
db.path: data/linkdb.links
```

Environment variables `PORT`, `HOST`, and `DB_PATH` can override these settings.

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Run all checks
npm run check
```

## Dependencies

| Package                         | Purpose                         |
| ------------------------------- | ------------------------------- |
| `@link-foundation/links-client` | Link-cli database client        |
| `links-notation`                | Links Notation parser/formatter |
| `lino-env`                      | Configuration management        |
| `express`                       | HTTP server                     |
| `test-anywhere`                 | Cross-runtime testing           |

## Links

- [Issue #1](https://github.com/link-foundation/ideav-local-associative-js/issues/1) - Original requirements
- [ideav/local](https://github.com/ideav/local) - Original PHP/Python implementation
- [link-cli](https://github.com/link-foundation/link-cli) - Links Theory database CLI
- [links-client](https://github.com/link-foundation/links-client) - JavaScript client for link-cli
- [links-notation](https://github.com/link-foundation/links-notation) - Data notation format

## License

Unlicense
