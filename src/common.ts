/* 3rd party imports */
import { randomBytes } from 'crypto';

export const generateRandomID = (): string =>
{
	return randomBytes(8).toString('base64');
};