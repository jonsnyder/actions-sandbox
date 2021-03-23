#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth
});

const owner = "jonsnyder";
const repo = "actions-sandbox";

const releaseType = process.argv[2];
if (releaseType !== "major" && releaseType !== "minor" && releaseType !== "patch") {
  throw new Error("usage: ./createRelease.js [major|minor|patch]");
}
const newVersion = semver.inc(package.version, releaseType);


const createIssue = async newVersion => {
  const response = await octokit.issues.create({
    owner,
    repo,
    title: newVersion,
    body: `Track progress of v${newVersion}`
  });
  console.log(JSON.stringify(response, null, 2));
  return response.data.id;
};

const fetchProjectId = async projectNumber => {
  const response = await octokit.projects.listForRepo({
    owner, repo, state: "open"
  });
  const project = response.data.find(project => project.number === projectNumber);
  return project.id;
};

const fetchColumnIdByName = async (projectId, columnName) => {
  const response = await octokit.projects.listColumns({ project_id: projectId });
  const column = response.data.find(column => column.name === columnName);
  return column.id;
}

const createIssueCard = async (columnId, issueId) => {
  const response = await octokit.projects.createCard({
    column_id: columnId,
    content_id: issueId,
    content_type: "Issue"
  });
  console.log(JSON.stringify(response, null, 2));
}

const listCardsInColumn = async (columnId) => {
  const response = await octokit.projects.listCards({
    column_id: columnId
  });
  console.log(JSON.stringify(response, null, 2));
}

const getByUrl = async (url) => {
  return octokit.request(`GET ${url}`);
};


/*
(async () => {
  //const issueId = await createIssue(newVersion);
  //const projectId = await fetchProjectId(1);
  //const columnId = await fetchColumnIdByName(projectId, "New");
  //createIssueCard(columnId, issueId);
  //listCardsInColumn(columnId);
  await getCardContent("https://api.github.com/repos/jonsnyder/actions-sandbox/issues/11");
})();
*/

const {
  event_name = "project_card",
  project_card: {
    project_url = "https://api.github.com/projects/12003213",
    column_url = "https://api.github.com/projects/columns/13454321",
    content_url = "https://api.github.com/repos/jonsnyder/actions-sandbox/issues/11",
  }
 } = github.context;

const main = async () => {
  if (event_name === "project_card") {

    const project = await getByUrl(project_url);
    if (project.data.number !== 1) {
      console.error("Card moved on non-release project.");
      process.exitCode = 1;
      return;
    }

    const issue = await getByUrl(content_url);
    if (!semver.valid(issue.data.name) || !semver.prerelease(issue.data.name) === null) {
      console.error("Issue name in project card is not a semantic version:", issue.data.name);
      process.exitCode = 1;
      return;
    }

    const { data: { name } } = await getByUrl(column_url);
    if (name !== "New" && name !== "Deploy") {
      console.error("Card moved to:", name);
      process.exitCode = 1;
      return;
    }

    // todo: grab the package version from the correct branch
    const version = semver.inc(issue.data.name, "prerelease", name.toLowerCase());
    if (semver.lt(version, package.version)) {
      console.error("Cannot release a version less than previous", package.version, version);
      process.exitCode = 1;
      return;
    }

    console.log(version);

  } else if (event_name === "push") {
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
  }
}

main();