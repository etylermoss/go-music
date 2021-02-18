/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
mutation IsSignedIn {
	isSignedIn {
		user_id
		username
		adminPriority
		details {
			email
			real_name
		}
	}
}
`;