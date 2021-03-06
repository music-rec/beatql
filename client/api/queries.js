import gql from 'graphql-tag';

export const QUERY_SONG_LIST = gql`
  query songList {
    songList {
      id
    }
  }
`;

export const QUERY_SONG = gql`
  query song($songId: String!) {
    song(songId: $songId) {
      id
      tempo
      sequencers {
        id
        resolution
        bars
        instruments {
          id
          instrumentType
          data
        }
      }
    }
  }
`;
