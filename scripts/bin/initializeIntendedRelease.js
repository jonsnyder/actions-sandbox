#!/usr/bin/env node

const { run, initializeCard } = require("../lib/container");

const releaseType = process.argv[2];
run(() => initializeCard(releaseType));
