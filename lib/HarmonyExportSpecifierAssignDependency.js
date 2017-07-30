var NullDependency = require("webpack/lib/dependencies/NullDependency");

class HarmonyExportSpecifierAssignDependency extends NullDependency {
  constructor(module, id, name, statement) {
    super();
    this.id = id;
    this.name = name;
    this.pos = statement.end;
    this.originModule = module;
    this.exportsArgument = module.exportsArgument;
  }
  get type() {
    return "harmony export specifier";
  }

  getExports() {
    return {
      exports: [this.name]
    };
  }

  describeHarmonyExport() {
    return {
      exportedName: this.name,
      precedence: 1
    };
  }
}

/*
 * export var foo = 1, bar;
 * foo = 2;
 * bar = 3;
 * var baz = 4;
 * export { baz }
 * baz = 5;
 *  =>
 * var foo = 1, bar;
 * __webpack_exports__["foo"] = foo;
 * __webpack_exports__["bar"] = bar;
 * foo = __webpack_exports__["foo"] = 2;
 * bar = __webpack_exports__["bar"] = 3;
 * var baz = 4;
 * __webpack_exports__["baz"] = baz;
 * baz = __webpack_exports__["baz"] = 5;
 *
 */
HarmonyExportSpecifierAssignDependency.Template = class HarmonyExportSpecifierAssignDependencyTemplate {
  apply(dep, source) {
    const used = dep.originModule.isUsed(dep.name);
    var code = `\n/* harmony export (binding) (assign) */ ${dep.exportsArgument}[${JSON.stringify(used)}] = ${dep.id};`;
    source.insert(dep.pos, code);
  }
};

module.exports = HarmonyExportSpecifierAssignDependency;
