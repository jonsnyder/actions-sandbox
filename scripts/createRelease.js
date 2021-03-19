#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth
});

const owner = "jonsnyder";
const repo = "actions-sandbox";

/*octokit.repos.listCommits({
  owner, repo, sha: "main"
}).then(response => {
  console.log(JSON.stringify(response, null, 2));
});*/
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

(async () => {
  const issueId = await createIssue(newVersion);
  const projectId = await fetchProjectId(1);
  const columnId = await fetchColumnIdByName(projectId, "New");
  createIssueCard(columnId, issueId);
  //listCardsInColumn(columnId);
})();