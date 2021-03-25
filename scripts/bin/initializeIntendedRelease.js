#!/usr/bin/env node

const container = require("../lib/container");

const releaseType = process.argv[2];
container.run(container.initializeCard(releaseType));
