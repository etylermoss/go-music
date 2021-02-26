/* 3rd party imports */
import { Service, Inject } from 'typedi';

/* 1st party imports - Services */
import { DatabaseService } from '@/database';

@Service('admin.service')
export class AdminService {

	@Inject('database.service')
	private dbSvc: DatabaseService;

	/** Checks if a given user is an admin.
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
	
	/** If the given user is an admin, returns their admin priority,
	 *  otherwise null is returned.
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

	/** Makes the given user an admin. Their admin priority is set as the
	 *  number of admins + 1. Returns success as boolean.
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

	/** Gets the number of current admin users. 
	 */
	getAdminCount(): number {
		return this.dbSvc.prepare(`
		SELECT COUNT(*) AS 'count'
		FROM AdminUser
		`).get().count;
	}
}