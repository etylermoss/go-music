/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation SignIn($data: SignInInput!) {
		signIn(data: $data) {
			user_id
			username
			adminPriority
			details {
				real_name
				email
			}
		}
	}
`;