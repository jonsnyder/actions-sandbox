#! /usr/bin/env bash

VERSION=$1

# install dependencies
npm ci

# run tests
npm run test

# setup configuration
git config user.name $GITHUB_ACTOR
git config user.email gh-actions-${GITHUB_ACTOR}@github.com
git remote add gh-origin git@github.com:${GITHUB_REPOSITORY}.git
npm config set //registry.npmjs.org/:_authToken=${NPM_TOKEN}

# update version in package.json and package-lock.json
npm version ${VERSION}
git push --force gh-origin HEAD:${GITHUB_REF} --follow-tags

# publish the package to NPM if it hasn't already been published
if [[ -z "$(npm view @jonsnyder01/increment@${VERSION})" ]]; then
  echo "Publishing to NPM"
  npm publish --access public
else
  echo "NPM already has version ${VERSION}"
fi
