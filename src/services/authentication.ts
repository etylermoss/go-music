/* 3rd party imports */
import { scryptSync, randomBytes } from 'crypto';
import { Service, Inject } from 'typedi';

/* 1st party imports */
import { ConfigSchema } from '@/config';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { LoggerService } from '@/services/logger';
import { UserService } from '@/services/user';

/* 1st party imports - GraphQL types */
import { SignUpInput } from '@/graphql/types/authentication';
import { User, UserDetails } from '@/graphql/types/user';

interface PasswordData {
	salt: Buffer;
	hash: Buffer;
}

/** Template string function to mark an SQL statement as unsafe, i.e
 *  it contains sensitive information that should not be logged.
 *  This will be looked for by the database logging function.
 */
const unsafe = (sqlInput: TemplateStringsArray): string => {
	return '/*UNSAFE*/' + sqlInput;
};

@Service('authentication.service')
export class AuthenticationService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	@Inject('logger.service')
	private logSvc: LoggerService;

	@Inject('config')
	private config: ConfigSchema;

	@Inject('user.service')
	private userSvc: UserService;

	/** Creates a new user along with related data such as their password.
	 *  Returns the user, including their personal details (email etc).
	 */
	createUser({ username, password, details}: SignUpInput): User | null {
		const user_id = randomBytes(8).toString('base64');
		const createUserChanges = this.dbSvc.prepare(`
		INSERT INTO Users (user_id, username)
		VALUES ($user_id, $username)
		`).run({ user_id, username }).changes;

		if (createUserChanges === 1) {
			this.createOrUpdateUserDetails(user_id, details);
		} else {
			this.logSvc.log('WARN', `Could not create user '${username}', likely already exists.`);
			return null;
		}

		this.createOrUpdateUserPassword(user_id, password);
		return this.userSvc.getUserByID(user_id, true);
	}

	/** Updates a users personal information (email etc.), returning
	 *  success as a boolean.
	 */
	createOrUpdateUserDetails(user_id: string, details: UserDetails): boolean {
		return this.dbSvc.prepare(`
		REPLACE INTO UserDetails (user_id, email, real_name)
		VALUES ($user_id, $email, $real_name)
		`).run({
			user_id: user_id,
			email: details.email,
			real_name: details.real_name,
		}).changes === 1 ? true : false; 
	}

	/** Updates the users password in the database, creating it if it (and
	 *  the salt) does not already exist. Returns success as a boolean.
	 */
	createOrUpdateUserPassword(user_id: string, password: string): boolean {
		const sqlCreatePasswordData = this.dbSvc.prepare(unsafe`
		REPLACE INTO UserPasswords (user_id, salt, hash)
		VALUES ($user_id, $salt, $hash)
		`);
		const salt = randomBytes(16);
		const hash = this.hashUserPassword(password, salt);
		return sqlCreatePasswordData.run({
			user_id,
			salt,
			hash,
		}).changes === 1 ? true : false;
	}

	/** Checks the supplied password against the supplied user_id.
	 */
	comparePasswordToUser(user_id: string, password: string): boolean {
		const passwordData = this.getUserPasswordData(user_id);
		if (passwordData && this.hashUserPassword(password, passwordData.salt).equals(passwordData.hash)) {
			return true;
		}
		return false;
	}

	/** Retrieves the associated user_id's password data (salt and hash).
	 */
	getUserPasswordData(user_id: string): PasswordData {
		return this.dbSvc.prepare(unsafe`
		SELECT salt, hash
		FROM UserPasswords
		WHERE user_id = $user_id
		`).get({user_id});
	}

	/** Generates and returns a new 128 bit authToken, and removes
	 *  the oldest token from the database if the user is at the limit.
	 */
	newAuthToken(user_id: string): string {
		const sqlGetTokenCount = this.dbSvc.prepare(`
		SELECT COUNT(*)
		FROM UserAuthTokens
		WHERE user_id = $user_id
		`);
		const sqlDeleteOldestToken = this.dbSvc.prepare(`
		DELETE FROM UserAuthTokens
		WHERE rowid =
			(
				SELECT rowid
				FROM UserAuthTokens
				WHERE user_id = $user_id
				ORDER BY creation_time ASC LIMIT 1
			)
		`);
		const sqlInsertToken = this.dbSvc.prepare(`
		INSERT INTO UserAuthTokens (user_id, token)
		VALUES ($user_id, $token)
		`);
		
		const token = randomBytes(16).toString('base64');
		const tokenCount = sqlGetTokenCount.get({user_id});

		if (tokenCount > this.config.maxClients) {
			sqlDeleteOldestToken.run({user_id});
		}
		
		sqlInsertToken.run({user_id, token});
		return token;
	}

	/** Checks if the supplied authToken is in the database, returning the
	 *  associated user_id.
	 */
	checkAuthToken(token: string): string | null {
		return this.dbSvc.prepare(`
		SELECT user_id
		FROM UserAuthTokens
		WHERE token = $token
		`).get({token})?.user_id || null;
	}

	/** Removes the authToken from the database, returning boolean success.
	 */
	removeAuthToken(token: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM UserAuthTokens
		WHERE token = $token
		`).run({token}).changes > 0 ? true : false;
	}

	/** Removes all authTokens from the database that are
	 *  associated with the given user_id. The number of
	 *  tokens retrieved is returned (> 0 === success).
	 */
	removeAllAuthTokens(user_id: string): number {
		return this.dbSvc.prepare(`
		DELETE FROM UserAuthTokens
		WHERE user_id = $user_id
		`).run({user_id}).changes;
	}

	/** Takes a password and hashes it using scrypt with the given salt. */
	private hashUserPassword(password: string, salt: Buffer): Buffer {
		return scryptSync(password, salt, 256);
	}
}