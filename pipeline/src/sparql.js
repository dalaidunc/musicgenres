const http = require('http');
const fs = require('fs');

class Endpoint {
  constructor (options) {
    this.baseURL = options.url;
    this.queryName = options.queryName || 'query';
    if (options.querySettings) {
      this.querySettings = options.querySettings;
    }
    this.queryThrottle = 1000;
    this.queryQueue = [];
  }
  get url () {
    let url = this.baseURL;
    if (this.querySettings) {
      url += '?';
      const params = [];
      for (let name in this.querySettings) {
        let val = this.querySettings[name];
        if (typeof val === 'string') {
          val = encodeURIComponent(val);
        }
        params.push(`${name}=${val}`);
      }
      url += params.join('&');
    }
    return url;
  }
  endOfQuery () {
    if (this.queryQueue.length > 0) {
      if (this.queryThrottle) {
        // wait a bit before running subsequent queries
        wait(this.queryThrottle).then(() => {
          this.processQuery(...this.queryQueue.shift());
        });
      } else {
        this.processQuery(...this.queryQueue.shift());
      }
    } else {
      this.running = false;
    }
  }
  processQuery (query, resolve, reject) {
    if (this.running) {
      // go to the back of the queue, buddy...
      this.queryQueue.push([query, resolve, reject]);
    } else {
      this.running = true;
      const url = this.url + `&${this.queryName}=${query.encoded}`;
      http.get(url, response => {
        const { statusCode } = response;
        if (statusCode !== 200) {
          let error = new Error(`Request Failed. Status Code: ${statusCode}`);
          response.resume();
          reject(error);
          this.endOfQuery();
          return;
        }

        response.setEncoding('utf8');

        let rawData = '';

        response.on('data', chunk => rawData += chunk);

        response.on('end', () => {
          try {
            let parsedData = JSON.parse(rawData);
            resolve(parsedData);
            this.endOfQuery();
          } catch (e) {
            reject(e);
            this.endOfQuery();
          }
        });
      }).on('error', e => {
        reject(e);
        this.endOfQuery();
      });
    }
  }
  runQuery (query) {
    return new Promise((resolve, reject) => {
      processQuery(query, resolve, reject);
    });
  }
}

// Helper dictionary to access common prefixes
const prefixes = {
  owl: '<http://www.w3.org/2002/07/owl#>',
  xsd: '<http://www.w3.org/2001/XMLSchema#>',
  rdfs: '<http://www.w3.org/2000/01/rdf-schema#>',
  rdf: '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>',
  foaf: '<http://xmlns.com/foaf/0.1/>',
  dc: '<http://purl.org/dc/elements/1.1/>',
  // TODO how to handle default?
  //: '<http://dbpedia.org/resource/>',
  dbpedia2: '<http://dbpedia.org/property/>',
  dbpedia: '<http://dbpedia.org/>',
  skos: '<http://www.w3.org/2004/02/skos/core#>',
  dbo: '<http://dbpedia.org/ontology/>',
  dbr: '<http://dbpedia.org/resource/>',
  dbp: '<http://dbpedia.org/property/>',
  schema: '<http://schema.org/>',
  yago: '<http://dbpedia.org/class/yago/>'
};

class Query {
  constructor (queryString, prefixes, groupBy, collectFields) {
    this.queryString = queryString;
    this.prefixes = prefixes;
    this.groupBy = groupBy;
    this.collectFields = new Set(collectFields);
  }
  makePrefixes () {
    return this.prefixes.map(prefix => {
      if (typeof prefix === 'string') {
        prefix = {
          name: prefix,
          uri: prefixes[prefix]
        };
      }
      return `PREFIX ${prefix.name}: ${prefix.uri}`
    }).join('\n');
  }
  toString () {
    return this.makePrefixes() + this.queryString;
  }
  get encoded () {
    return encodeURIComponent(this.toString().replace('\n', ''));
  }
}

module.exports = {
  Query,
  Endpoint
};
