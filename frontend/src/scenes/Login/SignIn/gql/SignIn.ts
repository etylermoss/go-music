/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation SignIn($data: SignInInput!) {
		signIn(data: $data) {
			userID
			username
			adminPriority
			details {
				realName
				email
			}
		}
	}
`;