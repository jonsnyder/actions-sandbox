#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");
const assert = require("./utils/assert");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth,
  previews: ["inertia-preview"] // inertia is the github codename for Projects
});

const getByUrl = url => {
  return octokit.request(`GET ${url}`);
};

const {
  ref: contextRef,
  eventName,
  payload: {
    project_card: {
      project_url,
      column_url,
      content_url,
    } = {},
    repository: {
      full_name: repositoryFullName
    }
  }
 } = github.context;

const [owner, repo] = repositoryFullName.split("/");

const hasBranch = async branch => {
  const matchingRefs = await octokit.git.listMatchingRefs({
    owner,
    repo,
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
  return contextRef;
};

//console.log(JSON.stringify(github.context, null, 2));

const main = async () => {
  if (eventName === "project_card") {

    const project = await getByUrl(project_url);
    assert(project.data.number === 1, "Card moved on non-release project.");

    const issue = await getByUrl(content_url);
    assert(semver.valid(issue.data.title), `Issue name in project card is not a semantic version: ${issue.data.title}`);
    assert(semver.prerelease(issue.data.title) === null, `Issue name in project card should not have prerelease version: ${issue.data.title}`);

    const { data: { name } } = await getByUrl(column_url);
    assert(name !== "New", "Nothing to do when name moved to \"New\"");
    let newVersion;
    if (name === "Release") {
      newVersion = issue.data.title;
    } else {
      newVersion = `${issue.data.title}-${name.toLowerCase()}.0`;
    }

    const ref = await findVersionBranch(issue.data.title);

    return { ref, inputs: { version: newVersion } };
  } else if (eventName === "push") {

    assert(semver.valid(package.version), `Invalid release version in package.json: ${package.version}`);
    const prerelease = semver.prerelease(package.version);
    assert(prerelease, "No pre-release candidate to release.");
    assert(prerelease.length === 2, `Unknown prerelease format: ${package.version}`);

    // increment version string
    const newVersion = semver.inc(package.version, "prerelease");
    // todo: find the issue url
    return { ref: contextRef, inputs: { version: newVersion } };
  } else {
    throw new Error("Unknown eventName:", eventName);
  }
}

main()
  .then(({ ref, inputs }) => {
    console.log("::set-output name=triggerWorkflow::true");
    console.log(`::set-output name=ref::${ref}`);
    console.log(`::set-output name=inputs::${JSON.stringify(inputs)}`);
  })
  .catch(error => {
    console.error(error.message);
    console.log("::set-output name=triggerWorkflow::false");
  });