#!/bin/bash

npx jsdoc ./scripts/inject-script.js ./scripts/README.md
rm -rf docs
mv out docs
