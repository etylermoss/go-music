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

function build_go {
	cd "$scriptdir"/go-api/
	rm -rf build; mkdir build
	go build -o ./build/
	cd "$scriptdir"
}

function build_node {
	rm -rf "$scriptdir"/build
	if [ "$(ls -A $scriptdir/client/build)" ] && [ "$(ls -A $scriptdir/go-api/build)" ]; then
		if [ "$1" = 'release' ]; then
			mkdir -p "$scriptdir"/build/usr/{bin,share/go-music/client,lib/go-music/go-api}
			cp -r "$scriptdir"/client/build/* "$scriptdir"/build/usr/share/go-music/client
			cp -r "$scriptdir"/go-api/build/* "$scriptdir"/build/usr/lib/go-music/go-api
		else
			mkdir -p "$scriptdir"/build/{client,go-api}
			cp -r "$scriptdir"/client/build/* "$scriptdir"/build/client/
			cp -r "$scriptdir"/go-api/build/* "$scriptdir"/build/go-api/
		fi
		npm run "$1" --prefix "$scriptdir"
	else
		echo 'Client or go-api is not built.' 1>&2
		exit 1
	fi
}

function build_full {
	mode="$1"
	if [ "$1" = 'release' ]; then
		mode='prod'
	fi
	build_client "$mode"
	build_go "$mode"
	build_node "$1"
}

if [ "$1" = 'clean' ]; then
	rm -rf "$scriptdir"/build "$scriptdir"/{client,go-api}/build
elif [ "$1" = 'client' ]; then
	build_client "$mode"
elif [ "$1" = 'go-api' ]; then
	build_go
elif [ "$1" = 'node' ]; then
	build_node "$mode"
elif [ "$1" = 'full' ]; then
	build_full "$mode"
else
	printf './build.sh full [dev, prod, release]: Builds everything (Recommended).
./build.sh clean: Cleans build folders.
./build.sh client [dev, prod, dev_server]: Builds frontend client app.
./build.sh go-api: Builds Go backend API.
./build.sh node [dev, prod, release]: Builds Node backend, requires Client & Go modules to be built (Not recommended).
'
fi