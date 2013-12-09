#!/bin/bash

if [ ! -f script/all-tests.sh ]; then
    echo "script should be run from main project directory!"
    exit
fi

script/copy-e2e-resources.sh
jasmine-node --verbose src/test/javascript
