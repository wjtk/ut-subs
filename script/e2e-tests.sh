#!/bin/sh
# run from main project dir

if [ ! -f script/e2e-tests.sh ]; then
    echo "script should be run from main project directory!"
    exit
fi

rm -rf target/e2e-data
mkdir -p target/e2e-data
cp src/test/resources/e2e-data/* target/e2e-data
jasmine-node --verbose src/test/javascript/e2e