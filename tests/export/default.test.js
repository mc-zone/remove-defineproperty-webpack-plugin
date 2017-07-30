var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./default");

describe("export default", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("object as default", () => {
    var entry = path.resolve(entryDir, "./object.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.default).toEqual({
          a:1,
          b:2,
          c:3
        });
      });
  });

  test("variable as default", () => {
    var entry = path.resolve(entryDir, "./variable.js");
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.default).toBe(1);
      });
  });

  test("function as default", () => {
    var entry = path.resolve(entryDir, "./function.js");
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.default()).toBe(1);
      });
  });

  test("class as default", () => {
    var entry = path.resolve(entryDir, "./class.js");
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        var cls = result.default;
        expect(new cls().value()).toBe(1);
      });
  });

});

