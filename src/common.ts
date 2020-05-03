/* File for commonly used functions and constants. */

/** Print exit message and exit program execution.
 *  Accepts process exit code, defaults to 0.
 */
const EXIT = (exitCode: number = 0, ...msg: string[]): void => {
	if (msg.length > 0) console.log(...msg);
	console.log(`\nExiting...`);
	process.exit(exitCode);
};

/** Prints error message and then exits the program
 *  by calling EXIT().
 */
const FATAL_ERROR = (...err: any[]): void => {
	console.error(`\x1b[31m\x1b[1m [FATAL ERROR]: `, ...err, `\x1b[0m`);
	EXIT(1);
};

/** Extensions seen by the server, used when
 *  searching for music files / album art.
 */
const extensionWhitelist =
[
	'mp3', 'opus', 'ogg', 'wav',
	'flac', 'm4a', 'aac', 'png',
	'jpg', 'jpeg', 'bmp', 'gif',
];

export { EXIT, FATAL_ERROR, extensionWhitelist };