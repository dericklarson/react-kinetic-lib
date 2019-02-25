#!/bin/sh

# Helpers
# ./node_modules/.bin/documentation  build  --document-exported  -o src/js/helpers.md -f md --markdown-toc false "src/utils/helpers/"

# APIs
./node_modules/.bin/documentation  build  --document-exported  -o src/apis/DiscussionsAPI.md -f md --markdown-toc false "src/apis/discussionApi.js"