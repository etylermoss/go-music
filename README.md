<h1 align="center">
	<a href="https://github.com/ajmar/go-music">
		Go Music
	</a>
</h1>

Description to be completed.

## 🔨 [Building from source](#-building-from-source)

1. **Install dependencies**
	
	You will need to have the [build dependencies](#build-dependencies) installed, these include `npm`, `node`, `node-gyp` and `gcc` (used to build better-sqlite3).

	```shell
	# Make sure you have the build deps installed!
	$> npm install
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
* See #mode for information on what directories the application will use for runtime data, as it dpends on what mode was used at build (e.g release / dev).

	```shell
	# alternatively: `$> ./build/go-music [ARGS]`
	$> npm run start -- [ARGS]
	```

	That's it! You can supply arguments such as --config. Run with --help for more information.

	### For developers:

	When developing there is the frontend dev server (uses webpack-dev-server). This is intended for working on the frontend without needing to build the backend every time, as well as live reloading of changes. You can run it like so:
	
	```shell
	# runs dev server on port + 1
	$> npm run start:front
	```

	When running the frontend dev server you will likely still need to run the backend for it to pull data from:

	```shell
	# disables serving of frontend by Express, only exposes /api.
	# alternatively: `$> ./build/go-music --api-only`
	$> npm run start:back
	```


## 📝 [Build details](#-build-details)

### Scripts:

There are three main scripts you may want to run, `build`, `build:front`, and `build:back`. End users looking to just build & run the application should only need `build`.

* `build [MODE]:` Build both the frontend and backend components.
* `build:front [MODE]:` Build the frontend but not the backend.
* `build:back [MODE]:` Build the backend but not the frontend. The frontend should be built prior to running this, unless running the frontend with `start:front`.

### Modes:

`[ dev (default), prod, release ]`

The `MODE` option is used to enable/disable optimizations and change the resulting build directory structure. The `dev` and `prod` modes are the same, except `prod` enables Webpack optimization. Application runtime data will be stored in the *./build/runtime/* directory.

If `release` is used, application runtime data will be stored in XDG User Directories, such as *~/.config/go-music/* and *~/.local/share/go-music/*.
