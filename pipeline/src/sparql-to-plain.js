/**
 * Takes a SPARQL response and returns a standard JSON dictionary.
 * @json - The raw JSON from a SPARQL endpoint
 * @groupKey - The field to use as the key for this dictionary
 * @collectFields - Any fields by which to group (set as an array)
 */
function parse (json, groupKey, collectFields) {
  const dict = {};
  json.results.bindings.forEach(binding => {
    const key = binding[groupKey].value;
    if (!dict[key]) {
      dict[key] = {};
    }
    const obj = dict[key];
    for (let name in binding) {
      const prop = binding[name];
      if (collectFields.has(name)) {
        if (prop.type === 'uri') {
          if (obj[name] && !obj[name].includes(prop.value)) {
            obj[name].push(prop.value);
          } else {
            obj[name] = [prop.value];
          }
        }
      } else {
        obj[name] = prop.value;
      }
    }
  });
  return dict;
}

module.exports = parse;
