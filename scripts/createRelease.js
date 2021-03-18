#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");

const auth = "6c518efa28567aa9cdc88ac046737aba5a2c6094";
const octokit = new Octokit({
  auth
});

const owner = "jonsnyder";
const repo = "actions-sandbox";

octokit.repos.listCommits({
  owner, repo, sha: "main"
}).then(response => {
  console.log(JSON.stringify(response, null, 2));
});