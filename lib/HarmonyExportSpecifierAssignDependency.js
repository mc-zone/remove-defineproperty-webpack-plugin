var NullDependency = require("webpack/lib/dependencies/NullDependency");
var util = require("./util");

class HarmonyExportSpecifierAssignDependency extends NullDependency {
	constructor(statement, module, moduleRange) {
		super();
		this.statement = statement;
    this.exportsArgument = module.exportsArgument;
    this.insertPos = moduleRange[1];
	}
	get type() {
		return "harmony export assign";
	}
}
HarmonyExportSpecifierAssignDependency.getExportedNames = function(statement){
  return statement.specifiers.map(specifier => specifier.exported.name);
}

/*
 * export { foo, bar }
 *  =>
 * __webpack_exports__["foo"] = foo;
 * __webpack_exports__["bar"] = bar;
 *
 */
HarmonyExportSpecifierAssignDependency.Template = class HarmonyExportSpecifierAssignDependencyTemplate {
  renderAssign(specifier, exportsArg){
    var exportName = specifier.exported.name;
    return `/* harmony export assign directly */ ${exportsArg}["${exportName}"] = ${exportName};\n`;
  }
	apply(dep, source) {
    var specifiers = dep.statement.specifiers;
    var code = specifiers.map(specifier => this.renderAssign(specifier, dep.exportsArgument)).join("");
    var replaceStart = dep.statement.start;
    var replaceUntil = dep.statement.end - 1;
    source.replace(replaceStart, replaceUntil, "");
    source.insert(dep.insertPos, code);
	}
};

module.exports = HarmonyExportSpecifierAssignDependency;


