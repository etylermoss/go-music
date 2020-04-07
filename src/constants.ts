/* Standard library for commonly used functions and large
 * strings, often throughout the project such as EXIT.
 * TODO: Rename to something like 'Common' instead of Constants.
 */

/** Print exit message and exit program execution.
 *  Accepts process exit code, defaults to 0.
 */
const EXIT = (exitCode: number = 0): void => {
	console.log(`\nExiting...`);
	process.exit(exitCode);
};

/** Prints error message and then exits the program
 *  by calling EXIT().
 */
const FATAL_ERROR = (err: string): void => {
	console.error(`\x1b[31m\x1b[1m [FATAL ERROR]: ${err}\x1b[0m`);
	EXIT(1);
};

/** Preamble text to be placed at the start of the
 *  configuration file to give information on it.
 */
const configPreamble =
`\
# Go Music: Configuration file.

# This file is written in the TOML format.
# Available options: <GITHUB/WIKI>.
# See: https://wikipedia.org/wiki/TOML.
\n`;

/** Extensions seen by the server, used when
 *  searching for music files / album art, entries
 *  must be lowercase with no . at the start
 */
const extensionWhitelist =
[
	'mp3', 'opus', 'ogg', 'wav',
	'flac', 'm4a', 'aac', 'png',
	'jpg', 'jpeg', 'bmp', 'gif'
];

/** Help information used when the user runs the
 *  application with -h or --help. 
 */
const getHelpInfo = (port: number): string => {
	return `\
Go Music: Personal music server.

  -c, --config: The directory of the configuration
    files. It will be created if it does not exist,
	and contain go-music.config.toml.
	Defaults to ~/.config/go-music/
  -p, --port: The port to run the server on.
	Currently this is overridden by the config file.
    Defaults to ${port}
  -h, --help: Print this help message.`;
};

export default { EXIT, FATAL_ERROR, configPreamble, extensionWhitelist, getHelpInfo };