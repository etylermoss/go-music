/* 3rd party imports */
import gql from 'graphql-tag';

export default gql`
	query AllSongs {
		songs {
            mediaResourceID
			media {
				path
				sourceResourceID
			}
		}
	}
`;