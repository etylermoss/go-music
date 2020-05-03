/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation SignUp($data: SignUpInput!) {
		signUp(data: $data) {
			success
			user {
				user_id
				username
				email
				real_name
			}
		}
	}
`;