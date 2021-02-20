/* 3rd party imports */
import { Container } from 'typedi';
import { Router } from 'express';

/* 1st party imports - Services */
import { AccessControlService, Operations } from '@/services/access-control';
import { AuthenticationService } from '@/services/authentication';
import { MediaService } from '@/services/media';

export const mediaAPIRouter = Router({caseSensitive: true});

mediaAPIRouter.get('/:resource_id', (req, res) => {
	const authSvc: AuthenticationService = Container.get('authentication.service');
	const aclSvc: AccessControlService = Container.get('access-control.service');
	const mediaSvc: MediaService = Container.get('media.service');

	const user_id = authSvc.checkAuthToken(req.cookies['authToken']);
	const level = aclSvc.getResourceAccessLevelForUser(user_id, req.params.resource_id);

	if (level && level >= Operations.READ)
	{
		/* serve file */
		const file = mediaSvc.getMediaByID(req.params.resource_id)!;
		res.setHeader('content-type', 'audio/unknown'); // TODO: audio type should be in database
		res.sendFile(file.file_full_path);
	}
	else
	{
		/* forbidden */
		res.status(403).send('You are not permitted to access this file (or it may not exist).');
	}
});