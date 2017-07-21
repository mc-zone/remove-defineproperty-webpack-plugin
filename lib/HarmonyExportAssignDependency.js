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
 * __webpack_exports__["foo"] = undefined; __webpack_exports__["bar"] = yyy;
 * __webpack_exports__["foo"] = xxx;
 * __webpack_exports__["bar"] = zzz;
 * 
 */
HarmonyExportAssignDependency.Template = class HarmonyExportAssignDependencyTemplate {
	apply(dep, source) {
    var statement = dep.statement;
    var declarations = statement.declaration.declarations;
    
    //remove "export var " "export let "
    source.replace(statement.start, declarations[0].start - 1, "/* harmony export assign directly */ ");

    declarations.forEach(dec => {
      var id = dec.id;
      var init = dec.init;
      if(!init){
        source.replace(id.start, id.end - 1, `${dep.exportsArgument}["${id.name}"] = undefined`);
      }else{
        source.replace(id.start, id.end - 1, `${dep.exportsArgument}["${id.name}"]`);
      }
    });
	}
};

module.exports = HarmonyExportAssignDependency;

