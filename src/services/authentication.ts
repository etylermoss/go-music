/* 3rd party imports */
import { scryptSync, randomBytes } from 'crypto';
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { UserService } from '@/services/user';

/* 1st party imports - SQL types */
import { UserSQL, UserDetailsSQL } from '@/services/user';

/* 1st party imports */
import { generateRandomID } from '@/common';
import { ConfigSchema } from '@/config';

export interface CreateUser {
	username: string;
	password: string;
	details: Omit<UserDetailsSQL, 'userID'>;
}

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

	/**
	 * Create a new user and accompanying authentication data (such as
	 * their password).
	 * @param user Object containing data for the new user
	 * @returns User if created
	 */
	createUser({username, password, details}: CreateUser): UserSQL | null {
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
		`).run({userID, username}).changes;

		/* Ensure that the user was inserted into the database */
		if (createUserChanges !== 1)
			return null;

		this.createOrUpdateUserDetails(userID, {...details, userID});
		this.updateUserPassword(userID, password);

		return this.userSvc.getUserByID(userID);
	}

	/**
	 * Create or update a users personal details (e.g. email).
	 * @param userID ID of user
	 * @param details User details to use
	 * @returns Success of operation
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

	/**
	 * Update the password of the given user, creating it (and the salt)
	 * if it does not already exist.
	 * @param userID ID of user
	 * @param password Password to create
	 * @returns Success of operation
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

	/**
	 * Check the given password matches the existing password of the given
	 * user (after salting & hashing).
	 * @param userID ID of user
	 * @param password Password to check
	 * @returns Success of comparison
	 */
	comparePasswordToUser(userID: string, password: string): boolean {
		const passwordData = this.getUserPasswordData(userID);
		if (passwordData && this.hashUserPassword(password, passwordData.salt).equals(passwordData.hash)) {
			return true;
		}
		return false;
	}

	/**
	 * Retrieve a user's password data.
	 * @param userID ID of user
	 * @returns Password data (salt & hash)
	 */
	getUserPasswordData(userID: string): PasswordData | null {
		return this.dbSvc.prepare(unsafe`
		SELECT
			salt,
			hash
		FROM
			UserPassword
		WHERE
			userID = ?
		`).get(userID) as PasswordData | undefined ?? null;
	}

	// TODO: reorder statements here?

	/**
	 * Create new authToken for the specified user.
	 * If the user is at their authToken limit, their oldest token is
	 * revoked.
	 * @param userID ID of user
	 * @returns authToken (`base64url` encoding)
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

	/**
	 * Search for specified authToken in the database.
	 * @param token Token to check
	 * @returns User ID of the authToken owner
	 */
	checkAuthToken(token: string): string | null {
		return this.dbSvc.prepare(`
		SELECT
			userID
		FROM
			UserAuthToken
		WHERE
			token = ?
		`).get(token)?.userID ?? null;
	}

	/**
	 * Revoke authToken. 
	 * @param token Token to delete
	 * @returns Success of operation
	 */
	revokeAuthToken(token: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM
			UserAuthToken
		WHERE
			token = ?
		`).run(token).changes > 0;
	}

	/**
	 * Revoke all authToken(s) associated with the given user.
	 * @param userID ID of user
	 * @returns Success of operation
	 */
	revokeAllAuthTokens(userID: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM UserAuthToken
		WHERE userID = $userID
		`).run({userID}).changes > 0 ? true : false;
	}

	/**
	 * Hash password using scrypt.
	 * @param password Password to hash
	 * @param salt Password salt
	 */
	private hashUserPassword(password: string, salt: Buffer): Buffer {
		return scryptSync(password, salt, 256);
	}
}