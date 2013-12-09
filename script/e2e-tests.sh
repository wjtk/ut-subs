#!/bin/sh
# run from main project dir

if [ ! -f script/e2e-tests.sh ]; then
    echo "script should be run from main project directory!"
    exit
fi

script/copy-e2e-resources.sh
jasmine-node --verbose src/test/javascript/e2e