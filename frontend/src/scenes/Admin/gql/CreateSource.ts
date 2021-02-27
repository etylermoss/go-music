/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation CreateSource($data: CreateSourceInput!) {
		createSource(data: $data) {
			resourceID
            name
            path
		}
	}
`;