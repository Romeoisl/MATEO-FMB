# MATEO-FMB

MATEO-FMB is an original modular Facebook Messenger bot framework designed around one principle: **features should never compromise runtime stability**.

## Architecture

```text
                         MATEO-FMB
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
       RUNTIME            FEATURES           CONTROL
          │                  │                  │
    Performance          Commands           Dashboard*
    Resource             Media              Metrics*
    Governor             AI                 Config
    Safety               Economy             Logs
    Recovery             Groups              Health
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                       Stable Runtime
```

\* The control-plane API is intentionally separated from bot feature code so a future dashboard can consume the same runtime state without becoming part of the command engine.

## Runtime

The runtime layer provides:

- centralized configuration and state;
- connection lifecycle and reconnect handling;
- event dispatching;
- command registration, permissions and cooldowns;
- host-aware CPU and memory budgeting;
- bounded command and network concurrency;
- inbound/outbound network accounting;
- cache and queue pressure controls;
- event-loop and filesystem pressure monitoring;
- safety detection for connection/authentication failures;
- recovery telemetry and graceful shutdown;
- health/status reporting.

Performance profiles are available through `/performance low`, `medium`, `normal`, `high`, and `max`. The governor deliberately does not assume that all RAM, CPU or disk reported by a desktop/server belongs to the bot.

## Features

Commands are independently loaded from `src/cmds/` and events from `src/events/`. The command context exposes stable services such as database, groups, users, moderation, AI, formatting, safety, performance and recovery.

Feature modules should remain replaceable and should use the runtime services instead of creating their own competing schedulers, resource pools or configuration systems.

## Control plane

The application exposes structured status through the health server. Runtime status includes connection state, command/user/group counts, safety state, recovery state and performance telemetry. This provides the foundation for a dashboard and operational tooling without coupling a web UI to the bot's internals.

## Configuration

`settings.json` contains non-secret defaults. Environment variables can override deployment-sensitive values. Runtime configuration can be persisted through `ConfigManager` when an operational setting is intentionally changed.

Never commit AppState, `.env`, logs, database files containing private runtime data, or generated state.

## Setup

1. Install dependencies with `npm install`.
2. Provide Facebook AppState locally through `appstate.json` or `MATEO_APPSTATE_FILE`.
3. Configure `settings.json` and environment variables.
4. Start with `npm start`.

## Design goals

MATEO-FMB is not built around a single giant command file. The target is a resilient runtime with independently scalable feature and control layers, so additional commands, media providers, AI integrations, economy systems and group features can be added without destabilizing the process.
