/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation SignUp($data: SignUpInput!) {
		signUp(data: $data) {
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