/* 3rd party imports */
import { randomBytes } from 'crypto';

export const generateRandomID = (): string =>
{
	return randomBytes(8).toString('base64url');
};

/** Print exit message and exit program execution.
 *  Accepts process exit code, defaults to 0.
 */
export const Exit = (exitCode: number = 0, ...msg: string[]): void => {
	if (msg.length > 0) console.log(...msg);
	console.log(`\nExiting...`);
	process.exit(exitCode);
};

/** Prints error message and then exits the program
 *  by calling EXIT().
 */
export const FatalError = (...err: any[]): void => {
	console.error(`\x1b[31m\x1b[1m [FATAL ERROR]: `, ...err, `\x1b[0m`);
	Exit(1);
};