# MATEO-FMB

MATEO-FMB is an original, modular Facebook Messenger bot framework built around a small core engine and independently loaded commands and events.

## Current architecture

```text
MATEO-FMB
├── index.js              # process entrypoint
├── src/
│   ├── bootstrap.js      # application startup
│   ├── core/             # configuration, connection, events, commands, state
│   ├── cmds/              # commands (migrated incrementally)
│   └── events/            # event handlers (migrated incrementally)
├── settings.json         # non-secret application defaults
├── db.json               # local JSON database during the migration
└── appstate.json         # local-only login state; never commit this file
```

## Phase 1

The foundation now provides:

- a long-lived application process instead of timer-based self-restarts;
- centralized configuration, logging and runtime state;
- a connection manager with login/error/reconnect handling;
- an event bus and event loader;
- a command registry with aliases, metadata and permission checks;
- a command context API for newly migrated commands;
- a JSON database adapter that keeps existing commands working during migration;
- a four-level permission model: user, group admin, bot admin, owner;
- safe repository defaults for local AppState and runtime files.

Existing commands and events remain in place and are being migrated through a compatibility bridge rather than discarded.

## Setup

1. Install dependencies with `npm install`.
2. Copy your Facebook AppState to the local `appstate.json` file, or set `MATEO_APPSTATE_FILE`.
3. Adjust `settings.json` for non-secret bot configuration.
4. Start with `npm start`.

Never commit AppState, `.env`, logs, or runtime state to Git.

## Roadmap

1. Foundation
2. Global and per-group configuration
3. Database abstraction and user/group/statistics stores
4. Essential commands and administration
5. Event system expansion
6. Protection and moderation
7. Economy and profiles
8. AI provider abstraction and conversations
9. Media and utilities
10. Deployment and health monitoring
11. Documentation, performance and security polish
