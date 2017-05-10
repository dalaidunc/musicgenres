const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const plainParse = require('../src/sparql-to-plain.js');
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
    OPTIONAL {{ ?genre dbpedia2:stylisticOrigins ?origins } UNION { ?genre dbo:stylisticOrigin ?origins }} .
    OPTIONAL { ?genre dbpedia2:derivatives ?derivatives } .
    OPTIONAL { ?genre dbpedia2:instruments ?instruments } .
    FILTER (LANG(?label) = 'en') .
    FILTER (LANG(?description) = 'en') .
  }
  GROUP BY ?genre
`, [
  'rdf', 'rdfs', 'dbpedia2', 'yago', 'dbo'
], 'genre', ['derivatives', 'origins', 'instruments']);

function checkValidGenres (genres) {
  const filteredGenres = [];
  console.log(genres.length);
  return series(genres, genre => {
    const query = new sparql.Query(`
      ASK {
        {<${genre}> a dbo:MusicGenre} UNION {<${genre}> a yago:MusicGenre107071942}
      }
    `, ['dbo', 'yago']);
    return endpoint.runQuery(query).then(json => {
      console.log(`${genre}: ${json.boolean}`);
      if (json.boolean) {
        filteredGenres.push(genre);
      }
    });
  });
}

function getGenreArtists (genre) {
  if (genre) {
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
    `, ['rdf', 'foaf', 'dbo', 'dbr', 'schema'], 'band', ['genre']);
    console.log(`Processing ${genre}...`);
    return endpoint.runQuery(query).then(json => {
      json = plainParse(json, query.groupBy, query.collectFields);
      console.log('Done!');
      const genreName = genre.substring(genre.lastIndexOf('/') + 1);
      return fs.writeFileAsync(`genres/${genreName}.json`, JSON.stringify(json, null, 2), 'utf8');
    });
  } else {
    console.log('error, bad name', genre);
  }
}

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
      // filter genres
      json = plainParse(json, query.groupBy, query.collectFields);
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
        return json;
      });
    }).catch(e => {
      console.log('error', e);
    });
}

function series (list, fn) {
  const next = list.shift();
  return fn(next).then(() => {
    if (list.length > 0) {
      return series (list, fn);
    }
  }).catch(e => {
    console.log('error', e);
  });
}

function start () {
  const start = Date.now();
  console.log(`Started`);
  getGenres()
    .then(genres => {
      // add all the genres found in derivatives and origins
      // TODO: Object.keys(genres).map
      console.log(`Total genres: ${Object.keys(genres).length}\nTime taken: ${Date.now()-start}`);
      checkValidGenres(Object.keys(genres).filter(key => {
        return genres[key].added;
      }));
      // series(Object.keys(genres), getGenreArtists, true).then(() => {
        // console.log(`Finished. Took: ${start - Date.now()}ms.`);
      // });
    }).catch(e => console.log('error', e));
}

start();
