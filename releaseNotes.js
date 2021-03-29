#!/usr/bin/env node

const package = require("../package.json");
const semver = require("semver");
const { Octokit } = require("@octokit/rest");
const assert = require("./utils/assert");

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth
});

const owner = "jonsnyder";
const repo = "actions-sandbox";


const listCommits = async () => {
/*
  const commitsInRelease = [];
  for await (const { data } of octokit.paginate.iterator(
    octokit.repos.listCommits,
    { owner, repo }
  )) {
    if (sha)
  }
*/
  const commits = await octokit.paginate(octokit.repos.listCommits, {
    owner, repo
  });
  const smallCommits = commits.map(({ sha, commit: { message }}) => ({ sha, message }));
  console.log(JSON.stringify(smallCommits, null, 2));
  return commits;
};

const listTags = async () => {
  const tags = await octokit.repos.listTags({
    owner, repo
  });
  const tagsBySha = tags.data
    .filter(({ name }) => name.startsWith("v") && semver.valid(name.substring(1)))
    .reduce((memo, { name, commit: { sha }}) => {
      memo[sha] = name;
      return memo;
    }, {});


  console.log(JSON.stringify(tagsBySha, null, 2));
  return tags;
}

const listPullRequests = async () => {
  const pullRequests = await octokit.pulls.list({
    owner, repo, state: "closed", sort: "created", direction: "desc"
  });
  console.log(JSON.stringify(pullRequests, null, 2));
}

const getByUrl = async (url) => {
  return octokit.request(`GET ${url}`);
};

const main = async () => {

  await listCommits();
};

main().
  catch(error => {
    console.error(error);
    process.exitCode = 1;
  });