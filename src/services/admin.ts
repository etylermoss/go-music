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
	isUserAdmin(user_id: string): boolean {
		return this.dbSvc.prepare(`
		SELECT ( user_id )
		FROM AdminUser
		WHERE user_id = $user_id
		`).get({user_id})?.user_id ? true : false;
	}

	// TODO: If more admin user properties are added, this should be
	// turned into 'getAdminUserDetails/Properties'.
	
	/** If the given user is an admin, returns their admin priority,
	 *  otherwise null is returned.
	 */
	getAdminUserPriority(user_id: string): number | null {
		const adminUserPriority = this.dbSvc.prepare(`
		SELECT ( priority )
		FROM AdminUser
		WHERE user_id = $user_id
		`).get({user_id})?.priority;
		return adminUserPriority ? adminUserPriority : null;
	}

	/** Makes the given user an admin. Their admin priority is set as the
	 *  number of admins + 1. Returns success as boolean.
	 */
	makeUserAdmin(user_id: string): boolean {
		const result = this.dbSvc.prepare(`
		INSERT INTO AdminUser (user_id, priority)
		VALUES ($user_id, ( SELECT COUNT(*) FROM AdminUser ) + 1)
		`).run({user_id});
		if (result.changes === 0) {
			console.log(`Could not make user_id ${user_id} an admin, does the user exist?`);
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