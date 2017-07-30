var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./alias");

describe("export alias", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("from specifier", () => {
    var entry = path.resolve(entryDir, "./specifier.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.newA).toBe(1);
        expect(result.b).toBe(2);
      });
  });

});

