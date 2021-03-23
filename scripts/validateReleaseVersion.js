#!/usr/bin/env node

/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const package = require("../package.json");
const semver = require("semver");
const assert = require("./utils/assert");

const newVersion = process.argv[2];

try {
  assert(semver.valid(newVersion), `New version is not a valid semantic version: ${newVersion}`);
  assert(semver.gt(newVersion, package.version), `Versions must be increasing. Attempted ${package.version} => ${newVersion}`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}