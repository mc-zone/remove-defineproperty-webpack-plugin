var NullDependency = require("webpack/lib/dependencies/NullDependency");
var util = require("./util");

class HarmonyExportSpecifierAssignDependency extends NullDependency {
	constructor(statement, module, moduleRange) {
		super();
		this.statement = statement;
    this.exportsArgument = module.exportsArgument;
	}
	get type() {
		return "harmony export assign";
	}
}
HarmonyExportSpecifierAssignDependency.getExportedNames = function(statement){
  return statement.specifiers.map(specifier => specifier.exported.name);
}

/*
 * var foo = 1, bar;
 * foo = 2;
 * bar = 3;
 * export { foo, bar }
 *  =>
 *  var foo = 1, bar;
 * foo = __webpack_exports__["foo"] = 2;
 * bar = __webpack_exports__["bar"] = 3;
 * __webpack_exports__["foo"] = foo;
 * __webpack_exports__["bar"] = bar;
 *
 */
HarmonyExportSpecifierAssignDependency.Template = class HarmonyExportSpecifierAssignDependencyTemplate {
  renderAssign(specifier, exportsArg){
    var exportName = specifier.exported.name;
    return `/* harmony export (binding) assign directly */ ${exportsArg}["${exportName}"] = ${exportName};\n`;
  }
	apply(dep, source) {
    var specifiers = dep.statement.specifiers;
    var code = specifiers.map(specifier => this.renderAssign(specifier, dep.exportsArgument)).join("");
    source.replace(dep.statement.start, dep.statement.end - 1, code);
	}
};

module.exports = HarmonyExportSpecifierAssignDependency;
