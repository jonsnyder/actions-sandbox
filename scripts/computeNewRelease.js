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

const {
  ref,
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

const assert = (success, message) => {
  if (!success) {
    throw new Error(message);
  }
};

const main = async () => {
  if (eventName === "project_card") {

    const project = await getByUrl(project_url);
    assert(project.data.number === 1, "Card moved on non-release project.");

    const issue = await getByUrl(content_url);
    assert(semver.valid(issue.data.title), `Issue name in project card is not a semantic version: ${issue.data.title}`);
    assert(semver.prerelease(issue.data.title), `Issue name in project card should not have prerelease version: ${issue.data.title}`);

    const { data: { name } } = await getByUrl(column_url);
    assert(name !== "New", "Nothing to do when name moved to \"New\"");
    let newVersion;
    if (name === "Release") {
      newVersion = issue.data.title;
    } else {
      newVersion = `${issue.data.title}-${name.toLowerCase()}.0`;
    }

    // todo: grab the package version from the correct branch
    // todo, make this fail the job
    assert(semver.gt(newVersion, package.version), `Error versions must be increasing. Attempted ${package.version} => ${newVersion}`);

    return { ref, inputs: { version: newVersion } };
  } else if (eventName === "push") {

    assert(semver.valid(package.version), `Invalid release version in package.json: ${package.version}`);
    const prerelease = semver.prerelease(package.version);
    assert(prerelease, "No pre-release candidate to release.");
    assert(prerelease.length === 2, `Unknown prerelease format: ${package.version}`);

    // increment version string
    const newVersion = semver.inc(package.version, "prerelease");
    // todo: find the issue url
    return { ref, inputs: { version: newVersion } };
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
    console.error(error);
    console.log("::set-output name=triggerWorkflow::false");
  });