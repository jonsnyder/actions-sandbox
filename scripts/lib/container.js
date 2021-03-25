const github = require("@actions/github");
const package = require("../../package.json");
const assert = require("./assert");
const createGithubFacade = require("./createGithubFacade");
const injectHandleProjectCardMove = require("./injectHandleProjectCardMove");
const injectHandlePush = require("./injectHandlePush");
const injectInitializeCard = require("./injectInitializeCard");
const injectRun = require("./injectRun");
const injectSetOutputVars = require("./injectSetOutputVars");
const injectValidateNewVersion = require("./injectValidateNewVersion");
const memoizeGetters = require("./memoizeGetters");
const process = require("process");
const { Octokit } = require("@octokit/rest");

const readEnvironmentVariable = name => {
  assert(process.env[name] != null, `The environment variable ${name} is required`);
  return process.env[name];
}


module.exports = memoizeGetters({
  get githubContext() {
    const {
      ref,
      eventName,
      payload: {
        project_card: {
          project_url: projectUrl,
          column_url: columnUrl,
          content_url: contentUrl,
        } = {}
      } = {}
     } = github.context;
    return {
      ref,
      eventName,
      projectUrl,
      columnUrl,
      contentUrl
    };
  },
  get auth() {
    return readEnvironmentVariable("GITHUB_AUTH");
  },
  get ownerAndRepo() {
    const repository = readEnvironmentVariable("GITHUB_REPOSITORY");
    assert(repository.includes("/"), "The GITHUB_REPOSITORY environment variable should be of the form ${owner}/${repo}");
    return repository.split("/");
  },
  get owner() {
    return this.ownerAndRepo[0];
  },
  get repo() {
    return this.ownerAndRepo[1];
  },
  get octokit() {
    return new Octokit({
      auth: this.auth,
      previews: ["inertia-preview"] // inertia is the github codename for Projects
    });
  },
  get githubFacade() {
    return createGithubFacade(this);
  },
  get projectUrl() {
    return this.githubContext.projectUrl;
  },
  get contentUrl() {
    return this.githubContext.contentUrl;
  },
  get columnUrl() {
    return this.githubContext.columnUrl;
  },
  get ref() {
    return this.githubContext.ref;
  },
  get eventName() {
    return this.githubContext.eventName;
  },
  get handleProjectCardMove() {
    return injectHandleProjectCardMove(this);
  },
  get packageVersion() {
    return package.version;
  },
  get projectNumber() {
    return 1;
  },
  get console() {
    return console;
  },
  get handlePush() {
    return injectHandlePush(this);
  },
  get initializeCard() {
    return injectInitializeCard(this);
  },
  get process() {
    return process;
  },
  get run() {
    return injectRun(this);
  },
  get setOutputVars() {
    return injectSetOutputVars(this);
  },
  get validateNewVersion() {
    return injectValidateNewVersion(this);
  }
});