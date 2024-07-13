#!/bin/bash

npx jsdoc scripts/inject-script.js
rm -rf docs
mv out docs
