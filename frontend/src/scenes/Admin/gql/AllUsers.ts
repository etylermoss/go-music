/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	query AllUsers {
		users {
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