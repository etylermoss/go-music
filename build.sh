#!/usr/bin/env bash

mode='dev'
scriptdir=$(dirname "$(readlink -f "$0")")

if [ -n "$2" ]; then
	mode="$2"
fi

function build_client {
	rm -rf "$scriptdir"/client/build
	npm run "$1" --prefix "$scriptdir"/client/
}

function build_node {
	rm -rf "$scriptdir"/build
	if [ "$(ls -A $scriptdir/client/build)" ]; then
		if [ "$1" = 'release' ]; then
			mkdir -p "$scriptdir"/build/usr/share/go-music/client/
			cp -r "$scriptdir"/client/build/* "$scriptdir"/build/usr/share/go-music/client
		else
			mkdir -p "$scriptdir"/build/client/
			cp -r "$scriptdir"/client/build/* "$scriptdir"/build/client/
		fi
		npm run "$1" --prefix "$scriptdir"
	else
		echo 'Client is not built.' 1>&2
		exit 1
	fi
}

function build_full {
	mode="$1"
	if [ "$1" = 'release' ]; then
		mode='prod'
	fi
	build_client "$mode"
	build_node "$1"
}

if [ "$1" = 'clean' ]; then
	rm -rf "$scriptdir"/build "$scriptdir"/client/build
elif [ "$1" = 'client' ]; then
	build_client "$mode"
elif [ "$1" = 'node' ]; then
	build_node "$mode"
elif [ "$1" = 'full' ]; then
	build_full "$mode"
else
	printf './build.sh full [dev, prod, release]: Builds everything (Recommended).
./build.sh clean: Cleans build folders.
./build.sh client [dev, prod, dev_server]: Builds frontend client app.
./build.sh node [dev, prod, release]: Builds backend, requires Client to be built already (Not recommended).
'
fi