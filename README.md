<h1 align="center">
	<a href="https://github.com/ajmar/go-music">
		Go Music
	</a>
</h1>

Personal music streaming server, built with a modern stack.

Work in progress, approximately 2/3rds the way to initial working prototype (i.e actually able to stream music). Things that are already implemented include signing in/up/out, authentication, scanning for music files (+ a lot of backend groundwork).

#### Why?

I was a long time user of Plex for my media collection, however it's interface is woeful for music, proprietary, and the company has a poor direction. Jellyfin/Emby is not really designed with music in mind, and comes with a lot of tech debt (though the Jellyfin guys are great!).

That's my justification for starting this project, I may not finish it but we'll see.

#### Stack

The following is the current tech stack for the project, frontend unfinished comparatively thus will likely change / grow.

Backend: Node.js, Typedi, Type-GraphQL w/ Apollo, Express, Better-sqlite3, TypeScript, Webpack.
Frontend: React, MobX, Apollo, React-Router, TypeScript, Webpack.

## 🔨 [Building from source](#-building-from-source)

1. **Install dependencies**
	
	You will need to have the [build dependencies](#build-dependencies) installed, these include `npm`, `nodejs`, `webpack`, `node-gyp` and `gcc` (used to build better-sqlite3).

	```shell
	# Install webpack globally (may require root privileges)
	$> npm install -g webpack
	$> npm install && cd frontend/ && npm install
	```

2. **Run build**
	
	Acceptable scripts are: `[ build, build:front, build:back ]`, while the second argument is the mode: `[ dev, prod, release ]`. See [build details](#-build-details) for more details. Here is the recommended command for most users:

	```shell
	# See #modes for information on the difference
	# between release and dev / prod.
	$> npm run build release
	```

## 🏁 [Starting the application](#-starting-the-application)

* Make sure you have the [runtime dependencies](#runtime-dependencies) installed, these include `nodejs` (tested with version ^13.9.0).
* See [build details - modes](#modes) for information on what directories the application will use for runtime data, as it depends on what mode was used at build (e.g release / dev).

	```shell
	# alternatively: `$> ./build/go-music [ARGS]`
	$> npm run start -- [ARGS]
	```

	That's it! You can supply arguments such as --config. Run with --help for more information.

	### For developers:

	When developing there is the frontend dev server (uses webpack-dev-server). This is intended for working on the frontend without needing to build the backend every time, as well as live reloading of changes. You can run it like so:
	
	```shell
	# runs dev server on port + 1
	$> npm run start:devServer
	```

	When running the frontend dev server you will likely still need to run the backend api for it to pull data from:

	```shell
	# disables serving of frontend by Express, only exposes /api.
	# alternatively: `$> ./build/go-music --api-only`
	$> npm run start:apiOnly
	```


## 📝 [Build details](#-build-details)

* ### Scripts:

	There are three main scripts you may want to run, `build`, `build:front`, and `build:back`. End users looking to just build & run the application should only need `build`.

	* `build [MODE]:` Build both the frontend and backend components.
	* `build:front [MODE]:` Build the frontend but not the backend.
	* `build:back [MODE]:` Build the backend but not the frontend. The frontend should be built prior to running this, unless running the frontend with `start:front`.

* ### Modes:

	`[ dev (default), prod, release ]`

	The `MODE` option is used to enable/disable optimizations and change the application directory structure & paths. The `dev` and `prod` modes are the same, except `prod` enables Webpack optimization. Application runtime data will be stored in the *./build/runtime/* directory.

	If `release` is used, application runtime data will be stored in XDG user directories, such as *~/.config/go-music/* and *~/.local/share/go-music/*.
