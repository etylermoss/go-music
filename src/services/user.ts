/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

export interface UserSQL {
	user_id: string;
    username: string;
}

export interface UserDetailsSQL {
	user_id: string;
	email: string;
	real_name: string;
}

@Service('user.service')
export class UserService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	/** Retrieves a users basic data (user_id, username), searching for
	 *  them by user_id.
	 */
	getUserByID(user_id: string): UserSQL | null {
		const user = this.dbSvc.prepare(`
		SELECT user_id, username
		FROM User
		WHERE user_id = $user_id
		`).get({user_id}) as UserSQL | undefined;

		return user ?? null;
	}

	/** Retrieves a users basic data (user_id, username), searching for
	 *  them by username.
	 */
	getUserByUsername(username: string): UserSQL | null {
		const user = this.dbSvc.prepare(`
		SELECT user_id, username
		FROM User
		WHERE username = $username
		`).get({username}) as UserSQL | undefined;

		return user ?? null;
	}
	
	/** Retrives a given user's personal information.
	 */
	getUserDetails(user_id: string): UserDetailsSQL | null {
		const details = this.dbSvc.prepare(`
		SELECT user_id, email, real_name
		FROM UserDetails
		WHERE user_id = $user_id
		`).get({user_id}) as UserDetailsSQL | undefined;

		return details ?? null;
	}
	
	/** Retrieves all users (user_id and username) from the database.
	 */
	getAllUsers(): UserSQL[] {
		return this.dbSvc.prepare(`
		SELECT user_id, username
		FROM User
		`).all() as UserSQL[];
	}

	/** Deletes a user, searching by the given user_id, returns success.
	 */
	deleteUser(user_id: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM User
		WHERE user_id = $user_id
		`).run({user_id}).changes > 0 ? true : false;
	}
}