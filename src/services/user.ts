/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';
import { AuthenticationService } from '@/services/authentication';

/* 1st party imports */
import { generateRandomID } from '@/common';

export interface UserSQL {
	userID: string;
    username: string;
}

export interface UserDetailsSQL {
	userID: string;
	email: string;
	realName: string;
}

export interface CreateUser {
	username: string;
	password: string;
	details: Omit<UserDetailsSQL, 'userID'>;
}

@Service()
export class UserService {

	constructor (
		private dbSvc: DatabaseService,
		private authSvc: AuthenticationService,
	) {}

	/**
	 * Retrieve a user, search by userID.
	 * @param userID ID of user
	 * @returns User
	 */
	getUserByID(userID: string): UserSQL | null {
		const user = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			User
		WHERE
			userID = ?
		`).get(userID) as UserSQL | undefined;

		return user ?? null;
	}

	/**
	 * Retrieve a user, search by username.
	 * @param username Username of user
	 * @returns User
	 */
	getUserByUsername(username: string): UserSQL | null {
		const user = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			User
		WHERE
			username = ?
		`).get(username) as UserSQL | undefined;

		return user ?? null;
	}
	
	/**
	 * Retrive a user's personal details, search by userID.
	 * @param userID ID of user
	 * @returns User details
	 */
	getUserDetails(userID: string): UserDetailsSQL | null {
		const details = this.dbSvc.prepare(`
		SELECT
			*
		FROM
			UserDetails
		WHERE
			userID = ?
		`).get(userID) as UserDetailsSQL | undefined;

		return details ?? null;
	}

	/**
	 * Retrieve all users.
	 * @returns User array
	 */
	getAllUsers(): UserSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			User
		`).all() as UserSQL[];
	}

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
		this.authSvc.updateUserPassword(userID, password);

		return this.getUserByID(userID);
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
	 * Deletes a user, searching by userID.
	 * @param userID ID of user
	 * @returns Success of deletion
	 */
	deleteUser(userID: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM
			User
		WHERE
			userID = ?
		`).run(userID).changes > 0;
	}
}