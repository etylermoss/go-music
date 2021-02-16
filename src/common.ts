/* File for commonly used functions and constants. */
/* 3rd party imports */
import { randomBytes } from 'crypto';

/** Extensions seen by the server, used when
 *  searching for music files / album art.
 */
export const extension_whitelist =
[
	'.mp3', '.opus', '.ogg', '.wav',
	'.flac', '.m4a', '.aac', '.png',
	'.jpg', '.jpeg', '.bmp', '.gif',
];

export const generateRandomID = (): string =>
{
	return randomBytes(8).toString('base64');
};