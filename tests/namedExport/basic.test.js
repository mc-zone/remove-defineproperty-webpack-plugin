var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./basic");

describe("namedExport basic", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("basic", () => {
    var entry = path.resolve(entryDir, "./basic.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.var1).toBe("modify var");
        expect(result.const1).toBe(456);
        expect(result.func1()).toBe(789);
      });
  });

});

