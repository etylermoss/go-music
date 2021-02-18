/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation SignUp($data: SignUpInput!) {
		signUp(data: $data) {
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