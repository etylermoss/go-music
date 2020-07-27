/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

/* 1st party imports - GraphQL types & inputs */
import { User, UserDetails } from '@/graphql/types/user';

@Service('user.service')
export class UserService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	/** Retrieves a users basic data (user_id, username), searching for
	 *  them by user_id.
	 */
	getUserByID(user_id: string, includeDetails: boolean = false): User {
		const user = this.dbSvc.prepare(`
		SELECT user_id, username
		FROM User
		WHERE user_id = $user_id
		`).get({user_id}) as User;
		if (includeDetails && user) {
			user.details = this.getUserDetails(user_id);
		}
		return user;
	}

	/** Retrieves a users basic data (user_id, username), searching for
	 *  them by username.
	 */
	getUserByUsername(username: string, includeDetails: boolean = false): User {
		const user = this.dbSvc.prepare(`
		SELECT user_id, username
		FROM User
		WHERE username = $username
		`).get({username}) as User;
		if (includeDetails && user) {
			user.details = this.getUserDetails(user.user_id);
			return user;
		} else {
			return user;
		}
	}
	
	/** Retrives a given user's personal information.
	 */
	getUserDetails(user_id: string): UserDetails {
		return this.dbSvc.prepare(`
		SELECT email, real_name
		FROM UserDetails
		WHERE user_id = $user_id
		`).get({user_id}) as UserDetails;
	}
	
	/** Retrieves all users (user_id and username) from the database.
	 */
	getUsers(): User[] {
		return this.dbSvc.prepare(`
		SELECT user_id, username
		FROM User
		`).all() as User[];
	}

	/** Deletes a user, searching by the given user_id, returning success
	 *  as boolean.
	 */
	deleteUser(user_id: string): boolean {
		return this.dbSvc.prepare(`
		DELETE FROM User
		WHERE user_id = $user_id
		`).run({user_id}).changes > 0 ? true : false;
	}
}