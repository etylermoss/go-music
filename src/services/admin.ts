/* 3rd party imports */
import { Service } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

@Service()
export class AdminService {

	constructor (
		private dbSvc: DatabaseService,
	) {}

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
	 * Their priority as admin is the highest priority of any current
	 * admins, plus one. (Or 0 if they are the first).
	 * @param userID ID of user
	 * @returns Success of operation
	 */
	makeUserAdmin(userID: string): boolean {
		const highestAdminPriority = this.dbSvc.prepare(`
		SELECT
			priority
		FROM
			AdminUser
		ORDER BY
			priority DESC
		LIMIT
			1
		`).get()?.priority as number | undefined ?? null;

		const result = this.dbSvc.prepare(`
		INSERT INTO AdminUser
		(
			userID,
			priority
		)
		VALUES
		(
			$userID,
			$priority
		)
		`).run({userID, priority: highestAdminPriority !== null ? highestAdminPriority + 1 : 1});

		return result.changes > 0;
	}

	/**
	 * Get the number of current admin users.
	 * @returns Number of admins
	 */
	getAdminCount(): number {
		return this.dbSvc.prepare(`
		SELECT
			COUNT(*)
		FROM
			AdminUser
		`).pluck().get();
	}
}