#!/bin/bash
next build && next export && mv out/_next out/next && sed -i -e 's=/_next/=/next/=g' out/**.html && mv out/*.html build && cd scripts && yarn build && cd .. &&  rsync -va --delete-after scripts/compiled/ build/scripts/ && rm -rf scripts/compiled && rsync -va --delete-after out/next/ build/next/ && rm -rf out && rsync -va public/ build/

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Open Chrome and browse to http://reload.extensions to reload the built extension"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  open -a \"Google Chrome\" http://reload.extensions
fi