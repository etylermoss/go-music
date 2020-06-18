/* 3rd party imports */
import { Container } from 'typedi';
import { createMethodDecorator } from 'type-graphql';

/* 1st party imports */
import Context from '@/context';

/* 1st party imports - Services */
import { AdminService } from '@/services/admin';

export const IsAdmin = (): MethodDecorator => {
	return createMethodDecorator<Context>(async ({context}, next) => {
		const adminSvc: AdminService = Container.get('admin.service');
		const user_id = context.user_id;

		if (user_id) {
			return adminSvc.isUserAdmin(user_id) ? next() : null;
		} else {
			return null;
		}
	});
};