#!/bin/sh
# run from main project dir


if [ ! -f script/unit-tests.sh ]; then
    echo "script should be run from main project directory!"
    exit
fi

jasmine-node --verbose --autotest src/test/javascript/unit --watch src/main/javascript/*