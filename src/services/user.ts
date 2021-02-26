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

	/** Retrieves a users basic data, searching for
	 *  them by userID.
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

	/** Retrieves a users basic data, searching for
	 *  them by username.
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
	
	/** Retrives a given user's personal information.
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
	
	/** Retrieves all users from the database.
	 */
	getAllUsers(): UserSQL[] {
		return this.dbSvc.prepare(`
		SELECT
			*
		FROM
			User
		`).all() as UserSQL[];
	}

	/** Deletes a user, searching by the given userID, returns success.
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