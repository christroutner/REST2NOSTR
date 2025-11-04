# REST2NOSTR Proxy API

A REST API server that proxies the Nostr WebSocket protocol, enabling JavaScript developers to interact with Nostr relays via familiar REST APIs instead of WebSockets. The idea for this app was birthed by [Rik Meijer](https://github.com/rikmeijer) in [this discussion thread](https://github.com/nostr-protocol/nips/issues/1549).

## Features

- **POST /event**: Publish signed Nostr events to relays
- **GET /req/:subId**: Stateless query for events (returns immediately)
- **POST /req/:subId**: Create subscription with Server-Sent Events (SSE) for real-time updates
- **PUT /req/:subId**: Alternative method for creating subscriptions
- **DELETE /req/:subId**: Close an existing subscription

## Architecture

This project follows Clean Architecture principles with clear separation of concerns:

- **Entities** (`src/entities/`): Domain models
- **Use Cases** (`src/use-cases/`): Business logic
- **Adapters** (`src/adapters/`): External interfaces (WebSocket client, logger)
- **Controllers** (`src/controllers/rest-api/`): Express.js route handlers

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (create `.env` file):
```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
NOSTR_RELAY_URL=wss://nostr-relay.psfoundation.info
```

3. Start the server:
```bash
npm start
```

## API Documentation

Generate API documentation:
```bash
npm run docs
```

The documentation will be generated in the `docs/` directory.

## API Endpoints

### POST /event

Publish a signed Nostr event to the relay.

**Request Body:**
```json
{
  "id": "5c83da77af1dec6d7289834998ad7aafbd9e2191396d75ec3cc27f5a77226f36",
  "pubkey": "2c7e76c0f8dc1dca9d0197c7d19be580a8d074ccada6a2f6ebe056ae41092e9",
  "created_at": 1672531200,
  "kind": 1,
  "tags": [],
  "content": "Hello, Nostr!",
  "sig": "abc123..."
}
```

**Response:**
```json
{
  "accepted": true,
  "message": "",
  "eventId": "5c83da77af1dec6d7289834998ad7aafbd9e2191396d75ec3cc27f5a77226f36"
}
```

### GET /req/:subId

Query events statelessly. Returns events immediately.

**Query Parameters:**
- `filters`: JSON-encoded array of filter objects

**Example:**
```bash
curl "http://localhost:3000/req/sub1?filters=[{\"kinds\":[1],\"limit\":10}]"
```

**Response:**
```json
[
  {
    "id": "...",
    "pubkey": "...",
    "created_at": 1672531200,
    "kind": 1,
    "tags": [],
    "content": "Hello, Nostr!",
    "sig": "..."
  }
]
```

### POST /req/:subId

Create a subscription for Server-Sent Events (SSE).

**Request Body:**
```json
{
  "kinds": [1],
  "authors": ["2c7e76c0f8dc1dca9d0197c7d19be580a8d074ccada6a2f6ebe056ae41092e9"]
}
```

**Response:** Server-Sent Events stream

### DELETE /req/:subId

Close an existing subscription.

**Response:**
```json
{
  "message": "Subscription sub1 closed successfully"
}
```

## Examples

See the `examples/` directory for refactored versions of common Nostr use cases:

- `01-create-account.js`: Create account and publish profile metadata
- `02-read-posts.js`: Read posts from a specific author
- `03-write-post.js`: Publish a text post
- `04-read-alice-posts.js`: Read posts from Alice
- `14-get-follow-list.js`: Get a user's follow list
- `15-update-follow-list.js`: Update a user's follow list
- `17-liking-event.js`: Like an event

Run examples:
```bash
node examples/03-write-post.js
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development, production)
- `LOG_LEVEL`: Logging level (info, debug, error)
- `NOSTR_RELAY_URL`: Default Nostr relay WebSocket URL

## License

MIT

