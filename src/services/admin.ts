/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

@Service('admin.service')
export class AdminService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	/**
	 * Checks if the given user is an admin.
	 * @param userID ID of user
	 * @returns Whether the user is an admin
	 */
	isUserAdmin(userID: string): boolean {
		return this.dbSvc.prepare(`
		SELECT
			userID
		FROM
			AdminUser
		WHERE
			userID = $userID
		`).get({userID})?.userID ? true : false;
	}
	
	/**
	 * Get the admin priority of the specified user (if they are an admin).
	 * @param userID ID of user
	 * @returns Admin priority
	 */
	getAdminUserPriority(userID: string): number | null {
		return this.dbSvc.prepare(`
		SELECT 
			priority
		FROM
			AdminUser
		WHERE
			userID = $userID
		`).get({userID})?.priority as number | undefined ?? null;
	}

	/**
	 * Make the specified user an admin.
	 * @param userID ID of user
	 * @returns Success of operation
	 */
	makeUserAdmin(userID: string): boolean {
		const result = this.dbSvc.prepare(`
		INSERT INTO AdminUser
		(
			userID,
			priority
		)
		VALUES
		(
			$userID,
			( SELECT COUNT(*) FROM AdminUser ) + 1
		)
		`).run({userID});
		if (result.changes === 0) {
			console.log(`Could not make userID ${userID} an admin, does the user exist?`);
			return false;
		}
		return true;
	}

	/**
	 * Get the number of current admin users.
	 * @returns Number of admins
	 */
	getAdminCount(): number {
		return this.dbSvc.prepare(`
		SELECT
			COUNT(*) AS 'count'
		FROM
			AdminUser
		`).get().count;
	}
}