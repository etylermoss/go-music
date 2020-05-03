/* 3rd party imports */
import { scryptSync, randomBytes } from 'crypto';
import { Service } from 'typedi';

/* 1st party imports */
import { DatabaseService } from '@/database';
import { User, SignUpInput } from '@/graphql/resolvers/authentication';

interface PasswordData {
	salt: Buffer;
	hash: Buffer;
}

@Service('authentication.service')
export class AuthenticationService extends DatabaseService {

	/** Retrieves a users data (username, email etc.), searching for them by username.
	 */
	getUserByUsername(username: string): User | null {
		const statement = this.connection.prepare('SELECT user_id, username, email, real_name FROM Users WHERE username = $username');
		return statement.get({username}) as User;
	}

	/** Retrieves a users data (username, email etc.), searching for them by user_id.
	 */
	getUserByID(user_id: string): User | null {
		const statement = this.connection.prepare('SELECT user_id, username, email, real_name FROM Users WHERE user_id = $user_id');
		console.log('getUserByID Error?', user_id, typeof user_id);
		return statement.get({user_id}) as User;
	}

	/** Creates a new user.
	 *  If the user cannot be created (e.g already exists), null is returned.
	 */
	createUser({ username, password, email, real_name}: SignUpInput): User | null {
		const user_id = randomBytes(8).toString('base64');
		const salt = randomBytes(16);
		const hash = scryptSync(password, salt, 256);
		const createUser = this.connection.prepare('INSERT INTO Users (user_id, username, email, real_name) VALUES ($user_id, $username, $email, $real_name)');
		const createPasswordData = this.connection.prepare('INSERT INTO UserPasswords (user_id, salt, hash) VALUES ($user_id, $salt, $hash)');
		try {
			createUser.run({
				user_id,
				username,
				email,
				real_name,
			});
			createPasswordData.run({
				user_id,
				salt,
				hash,
			});
		} catch {
			// TODO: App logging functionality to log error
			return null;
		}
		return this.connection.prepare('SELECT user_id, username, email, real_name FROM Users WHERE user_id = $user_id').get({user_id});
	}

	/** Retrieves the associated user_id's password data (salt and hash).
	 */
	getUserPasswordData(user_id: string): PasswordData {
		const statement = this.connection.prepare('SELECT salt, hash FROM UserPasswords WHERE user_id = $user_id');
		return statement.get({user_id});
	}

	/** Retrieves a users data, searching for them by username, as well as ensuring
	 *  that the input password matches the users stored password.
	 */
	getUserByUsernameAndPassword(username: string, password: string): User | null {
		const user = this.getUserByUsername(username);
		if (user) {
			const userPasswordData = this.getUserPasswordData(user.user_id);
			const inputHash = scryptSync(password, userPasswordData.salt, 256);
			if (inputHash.equals(userPasswordData.hash)) return user;
		}
		return null;
	}

	/** Generates and returns a new 128 bit authToken, and removes
	 *  the oldest token from the database if the user is at the limit.
	 */
	newAuthToken(user_id: string): string {
		// TODO: Get token limit from config
		const currentTokenCount = this.connection.prepare('SELECT COUNT(*) FROM UserAuthTokens WHERE user_id = $user_id').get({user_id});
		if (currentTokenCount > 10) this.connection.prepare('DELETE FROM UserAuthTokens WHERE rowid = ( SELECT rowid FROM UserAuthTokens WHERE user_id = $user_id ORDER BY creation_time ASC LIMIT 1 )').run({user_id});
		const token = randomBytes(16).toString('base64');
		const statement = this.connection.prepare('INSERT INTO UserAuthTokens (user_id, token) VALUES ($user_id, $token)');
		statement.run({user_id, token});
		return token;
	}

	/** Checks if the supplied authToken is in the database,
	 *  returns the associated user_id.
	 */
	checkAuthToken(token: string): string | null {
		const statement = this.connection.prepare('SELECT user_id FROM UserAuthTokens WHERE token = $token');
		return statement.get({token}).user_id;
	}

	/** Removes the authToken from the database,
	 *  returns success as boolean.
	 */
	removeAuthToken(token: string): boolean {
		const statement = this.connection.prepare('DELETE FROM UserAuthTokens WHERE token = $token');
		return statement.run({token}).changes > 0 ? true : false;
	}

	/** Removes all authTokens from the database that are
	 *  associated with the given user_id. The number of
	 *  tokens retrieved is returned (> 0 === success).
	 */
	removeAllAuthTokens(user_id: string): number {
		const statement = this.connection.prepare('DELETE FROM UserAuthTokens WHERE user_id = $user_id');
		return statement.run({user_id}).changes;
	}
}