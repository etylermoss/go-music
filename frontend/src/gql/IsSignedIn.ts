/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
mutation IsSignedIn {
	isSignedIn {
		userID
		username
		adminPriority
		details {
			email
			realName
		}
	}
}
`;