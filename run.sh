#!/usr/bin/env bash

function start () {
    npm install
    npm start
}

case "$1" in
    start)
        start
        ;;
    *)
    echo "Usage: run.sh {start}"
    exit 1
esac