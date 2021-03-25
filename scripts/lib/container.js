const github = require("@actions/github");
const package = require("../../package.json");
const assert = require("./assert");
const createGithubFacade = require("./createGithubFacade");
const injectHandleProjectCardMove = require("./injectHandleProjectCardMove");
const injectHandlePush = require("./injectHandlePush");
const injectInitializeCard = require("./injectInitializeCard");
const memoizeGetters = require("./memoizeGetters");

const readEnvironmentVariable = name => {
  assert(process.env[name] != null, `The environment variable ${name} is required`);
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
    return this.ownerAndRepo()[0];
  },
  get repo() {
    return this.ownerAndRepo()[1];
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
    return project_url;
  },
  get contentUrl() {
    return content_url;
  },
  get columnUrl() {
    return column_url;
  },
  get ref() {
    return github.context.ref;
  },
  get eventName() {
    return eventName
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
  }
});