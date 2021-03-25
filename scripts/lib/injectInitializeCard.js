const assert = require("./assert");
const semver = require("semver");

module.exports = ({ packageVersion, githubFacade, projectNumber, console }) => async (releaseType) => {

  assert(
    releaseType === "major" || releaseType === "minor" || releaseType === "patch",
    "`releaseType` must be major, minor, or patch."
  );
  assert(
    semver.prerelease(packageVersion) === null,
    `Package.json should contain a version with no prerelease qualifiers, got ${packageVersion}`
  );

  const newVersion = semver.inc(packageVersion, releaseType);

  const issueId = await githubFacade.createIssue({
    title: newVersion,
    body: `Track progress of release ${newVersion}.`
  });
  const projectId = await githubFacade.fetchProjectId(projectNumber);
  const columnId = await githubFacade.fetchColumnIdByName(projectId, "New");
  await githubFacade.createIssueCard(columnId, issueId);
  console.log(`Created release card: ${newVersion}`);
};