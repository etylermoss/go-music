/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

export interface UserSQL {
	userID: string;
    username: string;
}

export interface UserDetailsSQL {
	userID: string;
	email: string;
	realName: string;
}

@Service('user.service')
export class UserService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

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