#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth,
  previews: ["inertia-preview"] // inertia is the github codename for Projects
});

const getByUrl = url => {
  return octokit.request(`GET ${url}`);
};

const hasBranch = async branch => {
  const matchingRefs = await octokit.git.listMatchingRefs({
    owner: "jonsnyder",
    repo: "jonsnyder/actions-sandbox",
    ref: `heads/${branch}`,
    per_page: 1
  });
  console.log(JSON.stringify(matchingRefs, null, 2));
  return matchingRefs.data.length > 0 && matchingRefs.data[0].ref === `refs/heads/${branch}`;
};

const findVersionBranch = async version => {
  const versionParts = version.split(".");
  const patchBranch = `${versionParts[0]}.${versionParts[1]}.x`;
  const minorBranch = `${versionParts[0]}.x`;

  if (await hasBranch(patchBranch)) {
    return `refs/heads/${patchBranch}`;
  }
  if (await hasBranch(minorBranch)) {
    return `refs/heads/${minorBranch}`;
  }

  return `refs/heads/main`;
};

findVersionBranch("1.2.0").then(branch => console.log(branch));