const magic = require('./src/magic');
const pokeSerializer = require('./src/pokeHelpers');

function findSingleResult() {
  printResult(pokeSerializer.fromArray(process.argv, 2));
}

function printResult(pokemon) {
  magic(pokemon).toString().forEach(x => console.log(x))
}

findSingleResult()
