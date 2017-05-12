const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const plainParse = require('../src/sparql-to-plain.js');
const sparql = require('../src/sparql.js');

/**
 * Get all artists for each genre
 * @endpoint a sparql endpoint
 * @genres an array of genres
 */
export default class ArtistProcessor {
  constructor (endpoint, genres) {
    this.endpoint = endpoint;
    this.genres = genres;
  }
  processGenre (genre) {
    const query = new sparql.Query(`SELECT DISTINCT ?band, ?label, ?start, ?end, ?description, ?genre, ?hometown
    WHERE {
      ?band dbo:genre <${genre}> .
      ?band dbo:abstract ?description .
      ?band foaf:name ?label .
      { ?band rdf:type dbo:MusicalArtist }  UNION { ?band rdf:type dbo:Band } UNION { ?band rdf:type schema:MusicGroup } .
      OPTIONAL { ?band dbo:activeYearsStartYear ?start } .
      OPTIONAL { ?band dbo:activeYearsEndYear ?end } .
      OPTIONAL { ?band dbo:genre ?genre } .
      OPTIONAL { ?band dbo:hometown ?hometown } .
      FILTER (LANG(?label) = 'en') .
      FILTER (LANG(?description) = 'en') .
    }
    GROUP BY ?start
    `, ['rdf', 'foaf', 'dbo', 'dbr', 'schema']);
    console.log(`Processing ${genre}...`);
    return this.endpoint.runQuery(query).then(json => {
      json = plainParse(json, 'band', ['genre']);
      console.log('Done!');
      const genreName = genre.substring(genre.lastIndexOf('/') + 1);
      return fs.writeFileAsync(`genres/${genreName}.json`, JSON.stringify(json, null, 2), 'utf8');
    });
  }
}
