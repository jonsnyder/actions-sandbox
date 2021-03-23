#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");
const assert = require("./utils/assert");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth
});

const owner = "jonsnyder";
const repo = "actions-sandbox";




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

const main = async () => {

  const releaseType = process.argv[2];
  assert(
    releaseType === "major" || releaseType === "minor" || releaseType !== "patch",
    "Usage: ./createRelease.js [major|minor|patch]"
  );
  assert(
    semver.prerelease(package.version) === null,
    `Package.json should contain a version with no prerelease qualifiers, got ${package.version}`
  );

  const newVersion = semver.inc(package.version, releaseType);

  const issueId = await createIssue(newVersion);
  const projectId = await fetchProjectId(1);
  const columnId = await fetchColumnIdByName(projectId, "New");
  await createIssueCard(columnId, issueId);
  console.log(`Created release card: ${newVersion}`);
};

main().
  catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });