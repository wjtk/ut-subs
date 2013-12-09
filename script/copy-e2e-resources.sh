#!/bin/bash

rm -rf target/e2e-data
mkdir -p target/e2e-data
cp src/test/resources/e2e-data/* target/e2e-data