var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./wildcard");

describe("reExport wildcard", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("from export", () => {
    var entry = path.resolve(entryDir, "./fromExport.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
        expect(result.c).toBe(3);
      });
  });

  test("from module.exports", () => {
    var entry = path.resolve(entryDir, "./fromModuleExports.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
        expect(result.c).toBe(3);
      });
  });

});


