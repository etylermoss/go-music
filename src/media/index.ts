/* 3rd party imports */
import { Container } from 'typedi';
import { Router } from 'express';

/* 1st party imports - Services */
import { AccessControlService, Operations } from '@/services/access-control';
import { AuthenticationService } from '@/services/authentication';
import { MediaService } from '@/services/media';

export const mediaAPIRouter = Router({caseSensitive: true});

mediaAPIRouter.get('/:resourceID', (req, res) => {
	const authSvc = Container.get(AuthenticationService);
	const aclSvc = Container.get(AccessControlService);
	const mediaSvc = Container.get(MediaService);

	const resourceID = req.params.resourceID;
	const userID = authSvc.checkAuthToken(req.cookies['authToken']);

	if (userID && aclSvc.getResourceAccessLevelForUser(userID, resourceID) >= Operations.READ)
	{
		/* serve file */
		const media = mediaSvc.getMediaByID(resourceID)!;
		res.setHeader('content-type', media.mimeType ?? 'application/octet-stream');
		res.sendFile(media.path);
	}
	else
	{
		/* forbidden */
		res.status(403).send('You cannot access this file.');
	}
});