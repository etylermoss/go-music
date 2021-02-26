/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	mutation ScanSource($resourceID: String!) {
		scanSource(resourceID: $resourceID)
	}
`;