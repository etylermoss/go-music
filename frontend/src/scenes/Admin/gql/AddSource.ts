/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation AddSource($data: AddSourceInput!) {
		addSource(data: $data) {
			resourceID
            name
            path
		}
	}
`;