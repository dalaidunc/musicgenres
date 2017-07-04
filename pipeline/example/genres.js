const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const plainParse = require('../src/sparql-to-plain.js');
const d3Parse = require('../src/plain-to-d3.js');
const sparql = require('../src/sparql.js');

const endpoint = new sparql.Endpoint({
  url: 'http://dbpedia.org/sparql',
  querySettings: {
    'default-graph-uri': 'http://dbpedia.org',
    'format': 'application/sparql-results+json',
    'output': 'json',
    'timeout': 30000
  }
});

const query = new sparql.Query(`
  SELECT ?label, ?genre, ?description, ?origins, ?derivatives, ?instruments
  WHERE {
    {?genre a dbo:MusicGenre} UNION {?genre a yago:MusicGenre107071942} .
    ?genre rdfs:label ?label .
    OPTIONAL { ?genre dbo:abstract ?description } .
    OPTIONAL {{ ?genre dbp:stylisticOrigins ?origins } UNION { ?genre dbo:stylisticOrigin ?origins }} .
    OPTIONAL { ?genre dbp:derivatives ?derivatives } .
    OPTIONAL { ?genre dbp:instruments ?instruments } .
    FILTER (LANG(?label) = 'en') .
    FILTER (LANG(?description) = 'en') .
  }
  GROUP BY ?genre
`, [
  'rdf', 'rdfs', 'dbp', 'yago', 'dbo'
]);

function isValidGenre (uri) {
  const start = 'http://dbpedia.org/resource/';
  return uri.substring(0, start.length) === start;
}

function makeGenreLabel (uri) {
  return uri.substring(uri.lastIndexOf('/') + 1).replace('_', ' ');
}

function getGenres () {
  return endpoint.runQuery(query)
    .then(json => {
      return fs.writeFileAsync('raw.json', JSON.stringify(json, null, 2), 'utf8').then(() => {
        return json;
      });
    })
    .then(json => {
      // parse raw response into dict
      json = plainParse(json, 'genre', ['origins', 'derivatives', 'instruments']);
      // if a genre is within derivatives/origins but not in main genre list, we add it to the main list
      Object.keys(json).forEach(key => {
        const def = json[key];
        const foundGenres = (def.origins || []).concat(def.derivatives || []);
        foundGenres.filter(isValidGenre).forEach(genre => {
          if (!json[genre]) {
            console.log('adding genre: ' + genre);
            json[genre] = {
              added: true,
              genre,
              label: makeGenreLabel(genre)
            };
          }
        });
      });
      return fs.writeFileAsync('music-genres.json', JSON.stringify(json, null, 2), 'utf8').then(() => {
        return fs.writeFileAsync('music-genres-d3.json', JSON.stringify(d3Parse(json), null, 2), 'utf8').then(() => {
          return json;
        });
      });
    }).catch(e => {
      console.log('error', e);
    });
}

function start () {
  const start = Date.now();
  console.log('Started');
  getGenres()
    .then(genres => {
      // add all the genres found in derivatives and origins
      // TODO: Object.keys(genres).map
      console.log(`Total genres: ${Object.keys(genres).length}\nTime taken: ${Date.now()-start}`);
      // series(Object.keys(genres), getGenreArtists, true).then(() => {
        // console.log(`Finished. Took: ${start - Date.now()}ms.`);
      // });
    }).catch(e => console.log('error', e));
}

start();
