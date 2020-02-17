#!/usr/bin/env bash

mode='dev'
scriptdir=$(dirname "$(readlink -f "$0")")

if [ -n "$2" ]; then
	mode="$2"
fi

function build_client {
	npm run "$1" --prefix "$scriptdir"/client/
}

function build_go {
	return 0
}

function build_node {
	if [ "$(ls -A $scriptdir/client/build)" ] && [ "$(ls -A $scriptdir/server/go/build)" ]; then
		if [ ! -d "$scriptdir"/server/node/lib ]; then mkdir "$scriptdir"/server/node/lib; fi
		cp -r "$scriptdir"/client/build "$scriptdir"/server/node/lib/client
		cp -r "$scriptdir"/go/build "$scriptdir"/server/node/lib/go
		npm run "$1" --prefix "$scriptdir"/server/node/
		cp -r "$scriptdir"/server/node/build "$scriptdir"/build
	else
		echo 'client or server/go are not built.' 1>&2
		exit 1
	fi
}

function build_all {
	build_client "$1"
	build_go "$1"
	build_node "$1"
}

if [ "$1" = 'clean' ]; then
	rm -rf "$scriptdir"/build
	rm -rf "$scriptdir"/{client,server/go,server/node}/build
elif [ "$1" = 'client' ]; then
	build_client "$mode"
elif [ "$1" = 'go' ]; then
	build_go "$mode"
elif [ "$1" = 'node' ]; then
	build_node "$mode"
elif [ "$1" = 'full' ]; then
	build_all "$mode"
else
	printf './build.sh full [dev, prod]: Builds everything (Recommended).
./build.sh clean: Cleans build folders.
./build.sh client [dev, prod]: Builds frontend client app.
./build.sh go [dev, prod]: Builds Go backend API.
./build.sh node [dev, prod]: Builds Node backend, requires Client & Go modules to be built (Not recommended).
'
fi