#!/bin/bash

set -e

echo "Preparing release"

npm install
npm run test
npm run compile
npm run lint

echo "Repository is ready for release."