'use strict';

// MATEO-FMB runs as one long-lived process. Process supervisors such as
// Docker, systemd, Render, or Railway should own restarts; the application
// itself owns connection recovery and graceful shutdown.
require('./src/bootstrap');
