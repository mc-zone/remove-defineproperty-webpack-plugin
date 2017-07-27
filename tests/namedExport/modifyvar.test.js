var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./modifyvar");

describe("namedExport modify var", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("modify var in function", () => {
    var entry = path.resolve(entryDir, "./function.js"); 
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

        result.modifyBTo3();
        expect(result.b).toBe(3);
        expect(result.getValue().b).toBe(3);

        result.modifyFuncTo([1,2,3]);
        expect(result.modifyATo3).toEqual([1,2,3]);
        expect(result.modifyBTo3).toEqual([1,2,3]);
      });
  });

  test("modify var in condition", () => {
    var entry = path.resolve(entryDir, "./condition.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(2);
        expect(result.getValue()).toBe(2);
        for(var i = 3; i <= 9; i++){
          result["modifyTo" + i]();
          expect(result.a).toBe(i);
          expect(result.getValue()).toBe(i);
        }
      });
  });

  test("modify var in unary", () => {
    var entry = path.resolve(entryDir, "./unary.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.a).toBe(1);
        expect(result.getValue()).toBe(1);
        for(var i = 2; i <= 6; i++){
          result["modifyTo" + i]();
          expect(result.a).toBe(i);
          expect(result.getValue()).toBe(i);
        }
      });
  });
});
