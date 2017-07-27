var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./ignorevar");

describe("namedExport ignore var", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("function", () => {
    var entry = path.resolve(entryDir, "./function.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(0);
        result.tests.forEach(fn => fn());
        expect(result.a).toBe(0);
      });
  });

  test.only("condition", () => {
    var entry = path.resolve(entryDir, "./condition.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(0);
        expect(result.getValue()).toBe(0);
      });
  });

});

