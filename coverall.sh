#!/bin/bash

OK="uploaded test coverage"
FAIL="failed to upload test coverage"
if [[ -f .cover_env ]] ; then
  env $(cat .cover_env) ./node_modules/.bin/coveralls && echo $OK || echo $FAIL
  exit 0;
fi
./node_modules/.bin/coveralls && echo $OK || echo $FAIL
exit 0;

