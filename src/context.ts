/* 1st party imports */
import { Response, Request } from 'express';
import { ExecutionParams } from 'subscriptions-transport-ws';

/** Context used by Apollo Server */
export default interface Context {
	res: Response;
	req: Request;
	connection: ExecutionParams;
}