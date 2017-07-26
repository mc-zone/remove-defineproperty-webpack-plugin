var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

describe("namedExport", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("basic", () => {
    var entry = path.resolve(__dirname, "./basic.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.var1).toBe("modify var");
        expect(result.const1).toBe(456);
        expect(result.func1()).toBe(789);
      });
  });

  test.only("modify var in function", () => {
    var entry = path.resolve(__dirname, "./modifyvar.function.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(1);
        expect(result.getValue().a).toBe(1);
        expect(result.b).toBe(undefined);
        expect(result.getValue().b).toBe(undefined);

        result.modifyTo2();
        expect(result.a).toBe(2);
        expect(result.getValue().a).toBe(2);
        expect(result.b).toBe(2);
        expect(result.getValue().b).toBe(2);

        result.modifyATo3();
        expect(result.a).toBe(3);
        expect(result.getValue().a).toBe(3);
        expect(result.b).toBe(2);
        expect(result.getValue().b).toBe(2);

        result.modifyBTo4();
        expect(result.a).toBe(3);
        expect(result.getValue().a).toBe(3);
        expect(result.b).toBe(4);
        expect(result.getValue().b).toBe(4);
      });
  });
});
