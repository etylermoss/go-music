/* 3rd party imports */
import { scryptSync, randomBytes } from 'crypto';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { UserService } from '@/services/user';

/* 1st party imports - SQL types */
import { UserSQL, UserDetailsSQL } from '@/services/user';

/* 1st party imports - GraphQL inputs */
import { SignUpInput } from '@/graphql/inputs/authentication';

/* 1st party imports */
import { generateRandomID } from '@/common';
import { ConfigSchema } from '@/config';

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

	@Inject('config')
	private config: ConfigSchema;

	@Inject('user.service')
	private userSvc: UserService;

	/** Creates a new user along with related data such as their password.
	 *  Returns the user, including their personal details (email etc).
	 */
	createUser({ username, password, details}: SignUpInput): UserSQL | null {
		const userID = generateRandomID();
		const createUserChanges = this.dbSvc.prepare(`
		INSERT INTO User
		(
			userID,
			username
		)
		VALUES
		(
			$userID,
			$username
		)
		`).run({ userID, username }).changes;

		/* Ensure that the user was inserted into the database */
		if (createUserChanges !== 1)
			return null;

		const userDetails: UserDetailsSQL = {
			userID,
			email: details.email,
			realName: details.realName,
		};

		this.createOrUpdateUserDetails(userID, userDetails);
		this.updateUserPassword(userID, password);

		return this.userSvc.getUserByID(userID);
	}

	/** Updates a users personal information (email etc.), returning
	 *  success as a boolean.
	 */
	createOrUpdateUserDetails(userID: string, details: UserDetailsSQL): boolean {
		return this.dbSvc.prepare(`
		REPLACE INTO UserDetails (userID, email, realName)
		VALUES ($userID, $email, $realName)
		`).run({
			userID: userID,
			email: details.email,
			realName: details.realName,
		}).changes > 0;
	}

	/** Updates the users password in the database, creating it if it (and
	 *  the salt) does not already exist. Returns success as a boolean.
	 */
	updateUserPassword(userID: string, password: string): boolean {
		const salt = randomBytes(16);

		return this.dbSvc.prepare(unsafe`
		REPLACE INTO UserPassword
		(
			userID,
			salt,
			hash
		)
		VALUES
		(
			$userID, 
			$salt,
			$hash
		)
		`).run({
			userID,
			salt,
			hash: this.hashUserPassword(password, salt),
		}).changes > 0;
	}

	/** Checks the supplied password against the supplied userID.
	 */
	comparePasswordToUser(userID: string, password: string): boolean {
		const passwordData = this.getUserPasswordData(userID);
		if (passwordData && this.hashUserPassword(password, passwordData.salt).equals(passwordData.hash)) {
			return true;
		}
		return false;
	}

	/** Retrieves the associated userID's password data (salt and hash).
	 */
	getUserPasswordData(userID: string): PasswordData {
		return this.dbSvc.prepare(unsafe`
		SELECT salt, hash
		FROM UserPassword
		WHERE userID = $userID
		`).get({userID});
	}

	// TODO: reorder statements here?
	/** Generates and returns a new 128 bit authToken, and removes
	 *  the oldest token from the database if the user is at the limit.
	 */
	newAuthToken(userID: string): string {
		const sqlGetTokenCount = this.dbSvc.prepare(`
		SELECT
			COUNT(*)
		FROM
			UserAuthToken
		WHERE
			userID = $userID
		`);
		const sqlDeleteOldestToken = this.dbSvc.prepare(`
		DELETE FROM UserAuthToken
		WHERE rowid =
			(
				SELECT rowid
				FROM UserAuthToken
				WHERE userID = $userID
				ORDER BY creationTime ASC LIMIT 1
			)
		`);
		const sqlInsertToken = this.dbSvc.prepare(`
		INSERT INTO UserAuthToken
		(
			userID,
			token
		)
		VALUES
		(
			$userID,
			$token
		)
		`);
		
		const token = randomBytes(16).toString('base64url');
		const tokenCount = sqlGetTokenCount.get({userID});

		if (tokenCount > this.config.maxClients) {
			sqlDeleteOldestToken.run({userID});
		}
		
		sqlInsertToken.run({userID, token});
		return token;
	}

	/** Checks if the supplied authToken is in the database, returning the
	 *  associated userID.
	 */
	checkAuthToken(token: string): string | null {
		return this.dbSvc.prepare(`
		SELECT userID
		FROM UserAuthToken
		WHERE token = $token
		`).get({token})?.userID ?? null;
	}

	/** Removes the authToken from the database, returning boolean success.
	 */
	revokeAuthToken(token: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM UserAuthToken
		WHERE token = $token
		`).run({token}).changes > 0;
	}

	/** Removes all authTokens from the database that are associated with
	 *  the given userID, returning boolean success.
	 */
	revokeAllAuthTokens(userID: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM UserAuthToken
		WHERE userID = $userID
		`).run({userID}).changes > 0 ? true : false;
	}

	/** Takes a password and hashes it using scrypt with the given salt. */
	private hashUserPassword(password: string, salt: Buffer): Buffer {
		return scryptSync(password, salt, 256);
	}
}