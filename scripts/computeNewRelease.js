#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth,
  previews: ["inertia-preview"]
});

const getByUrl = url => {
  return octokit.request(`GET ${url}`);
};

const {
  eventName,
  payload: {
    project_card: {
      project_url,
      column_url,
      content_url,
    } = {}
  }
 } = github.context;

//console.log(JSON.stringify(github.context, null, 2));

const main = async () => {
  if (eventName === "project_card") {

    const project = await getByUrl(project_url);
    if (project.data.number !== 1) {
      console.error("Card moved on non-release project.");
      process.exitCode = 1;
      return;
    }

    const issue = await getByUrl(content_url);
    //console.log(JSON.stringify(issue, null, 2));
    if (!semver.valid(issue.data.title) || !semver.prerelease(issue.data.title) === null) {
      console.error("Issue name in project card is not a semantic version:", issue.data.title);
      process.exitCode = 1;
      return;
    }

    const { data: { name } } = await getByUrl(column_url);
    if (name === "New" || name === "Release") {
      console.error("Card moved to:", name);
      process.exitCode = 1;
      return;
    }

    // todo: grab the package version from the correct branch
    const version = `${issue.data.title}-${name.toLowerCase()}.0`;
    if (semver.lt(version, package.version)) {
      console.error("Cannot release a version less than previous", package.version, version);
      process.exitCode = 1;
      return;
    }

    console.log(version);
  } else if (eventName === "push") {
    // check package.json version
    // make sure it is beta or alpha version
    const prerelease = semver.prerelease(package.version);
    if (!semver.valid(package.version)) {
      console.error("Invalid release version in package.json:", package.version);
      process.exitCode = 1;
      return;
    }
    if (!prerelease) {
      console.error("No pre-release candidate to release.");
      process.exitCode = 1;
      return;
    }
    if (prerelease.length !== 2) {
      console.error("Unknown prerelease format:", package.version);
      process.exitCode = 1;
      return;
    }
    // increment version string
    console.log(semver.inc(package.version, "prerelease"));
  } else {
    console.error("Unknown eventName:", eventName);
    process.exitCode = 1;
    return;
  }
}

main();