var NullDependency = require("webpack/lib/dependencies/NullDependency");
var util = require("./util");

class HarmonyExportAssignDependency extends NullDependency {
	constructor(statement, module, moduleRange) {
		super();
		this.statement = statement;
    this.exportsArgument = module.exportsArgument;
	}
	get type() {
		return "harmony export assign";
	}
}

HarmonyExportAssignDependency.getExportedNames = function(statement){
  return statement.declaration.declarations.map(dec => dec.id.name);
}

/*
 * export var foo, bar = yyy;
 * foo = xxx;
 * bar = zzz;
 *   =>
 * var foo, bar = yyy;
 * __webpack_exports__["foo"] = foo;
 * __webpack_exports__["bar"] = bar;
 * foo = __webpack_exports__["foo"] = xxx;
 * bar = __webpack_exports__["bar"] = zzz;
 * 
 */
HarmonyExportAssignDependency.Template = class HarmonyExportAssignDependencyTemplate {
  renderAssign(dec, exportsArg){
    var id = dec.id;
    return `/* harmony export assign directly */${exportsArg}["${id.name}"] = ${id.name};`;
  }
	apply(dep, source) {
    var statement = dep.statement;
    var declarations = statement.declaration.declarations;
    var code = declarations.map(dec => this.renderAssign(dec, dep.exportsArgument)).join("");

    //remove "export"
    source.replace(statement.start, statement.declaration.start - 1, "");
    source.insert(statement.end, code);
	}
};

module.exports = HarmonyExportAssignDependency;

