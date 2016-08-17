const magic = require('./src/magic');
const FileParser = require('./src/fileParsers/fileParser');
const pokeSerializer = require('./src/pokeHelpers');

function processInput() {
  if (process.argv.length === 3) {
    return findResultsForFile(null, process.argv[2]);
  } else if (process.argv.length === 4) {
    return findResultsForFile(process.argv[2], process.argv[3]);
  }

  console.log('Requires 1 - 2 arguments (trainerLevel optional), format command as: ');
  console.log('node parseFileIvs.js trainerLevel inputFile.csv > outputFile.csv');
}

function findResultsForFile(trainerLevel, filename) {
  const parser = new FileParser(filename).file;
  var resultString;

  if (!parser) {
    return console.log(`${filename} is not a valid file type`);
  }

  if (!parser.isValid()) {
    return parser.errors.forEach(x => console.log(x));
  }

  parser.read(() => {
    console.log(parser.headerString());
    parser.pokemonList.forEach((pokemon) => {
      try {
        resultString = parser.resultString(pokemon, magic(pokemon).asObject());
      } catch(err) {
        resultString = parser.resultString(pokemon, {
          range: { iv: ['Not found', 'Not found'] }
        });
      }
      console.log(resultString);
    });
  });
}

processInput();
