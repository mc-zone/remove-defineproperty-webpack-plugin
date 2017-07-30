var path = require("path");
var builder = require("../builder");
var runner = require("../runner");

var entryDir = path.resolve(__dirname, "./basic");

describe("export basic", () => {
  var ctx;
  beforeEach(() => {
    ctx = {}; 
  });

  test("basic", () => {
    var entry = path.resolve(entryDir, "./basic.js"); 
    return builder(entry)
      .then(script => runner(script, ctx))
      .then(result => {
        expect(result.var1).toBe("var1");
        expect(result.var2).toBe("var2");
        expect(result.var3).toBe("var3");
        expect(result.const1).toBe("const1");
        expect(result.const2).toBe("const2");
        expect(result.func1()).toBe("func1");
      });
  });

});

