/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	query AllSources {
		sources {
			resourceID
			name
			path
		}
	}
`;