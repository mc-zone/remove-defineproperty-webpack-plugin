var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./ignorevar");

describe("setter ignore var", () => {
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

  test("condition", () => {
    var entry = path.resolve(entryDir, "./condition.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(0);
        expect(result.getValue()).toBe(0);
      });
  });

  test("redeclare hoist", () => {
    var entry = path.resolve(entryDir, "./redeclareHoist.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(1);
        expect(result.getValue()).toBe(1);
        result.run();
        expect(result.a).toBe(1);
        expect(result.getValue()).toBe(1);
      });
  });

});

