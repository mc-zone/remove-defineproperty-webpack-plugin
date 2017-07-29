var NullFactory = require("webpack/lib/NullFactory");
var HarmonyModulesHelpers = require("webpack/lib/dependencies/HarmonyModulesHelpers");
var HarmonyCompatibilityDependency = require("./lib/HarmonyCompatibilityDependency");
var HarmonyExportSpecifierAssignDependency = require("./lib/HarmonyExportSpecifierAssignDependency");
var HarmonyExportImportedSpecifierAssignDependency = require("./lib/HarmonyExportImportedSpecifierAssignDependency");
var AssignInsertHelper = require("./lib/AssignInsertHelper");
var util = require("./lib/util");

module.exports = class RemoveDefinePropertyWebpackPlugin {
	constructor(options){
		this.options = options;
    this.moduleAST = new Map();
    this.moduleShouldInsertAssigns = new Map();
	}

  shouldExportAssignDirectly(statement){
    var declaration = statement.declaration;
    var specifiers = statement.specifiers;
    if(declaration && !util.isImmutableStatement(declaration) && declaration.type == "VariableDeclaration"){
      return true;
    }
    if(!declaration && specifiers){
      return true;
    }
    return false;
  }

  modifyCompatibility(module){
    for(var index = 0; index < module.dependencies.length; index++){
      var dep = module.dependencies[index];
      if(dep.constructor.name == "HarmonyCompatibilityDependency"){
        module.dependencies.splice(index, 1);
        const newDep = new HarmonyCompatibilityDependency(module);
        newDep.loc = dep.loc;
        module.addDependency(newDep);
        break;
      }
    }
  }

  setup(compilation){
    compilation.dependencyFactories.set(HarmonyCompatibilityDependency, new NullFactory());
    compilation.dependencyFactories.set(HarmonyExportSpecifierAssignDependency, new NullFactory());
    compilation.dependencyFactories.set(HarmonyExportImportedSpecifierAssignDependency, new NullFactory());
    compilation.dependencyTemplates.set(HarmonyCompatibilityDependency, new HarmonyCompatibilityDependency.Template());
    compilation.dependencyTemplates.set(HarmonyExportSpecifierAssignDependency, new HarmonyExportSpecifierAssignDependency.Template());
    compilation.dependencyTemplates.set(HarmonyExportImportedSpecifierAssignDependency, new HarmonyExportImportedSpecifierAssignDependency.Template());
  }

	apply(compiler){
		compiler.plugin("compilation", (compilation, data) => {
      this.setup(compilation);
      
			data.normalModuleFactory.plugin("parser", (parser, options) => {
				parser.plugin("program", (ast, comments) => {
          const module = parser.state.module;
          this.currentAST = ast;
          this.moduleAST.set(module, ast);
          this.moduleShouldInsertAssigns.set(module, new Set());
          process.nextTick(() => {
            this.modifyCompatibility(module);
          })
				});
        
        parser.plugin("export specifier", (statement, id, name, idx) => {
          if(this.shouldExportAssignDirectly(statement)){
            var module = parser.state.current;
            var dep = new HarmonyExportSpecifierAssignDependency(module, id, name, statement);
            var nameSet = this.moduleShouldInsertAssigns.get(module);
            module.addDependency(dep);
            nameSet.add(name);
            return true;
          } 
				});

        parser.plugin("export import specifier", (statement, source, id, name, idx) => {
          const dep = new HarmonyExportImportedSpecifierAssignDependency(parser.state.module, parser.state.lastHarmonyImport, HarmonyModulesHelpers.getModuleVar(parser.state, source), id, name);
          dep.loc = Object.create(statement.loc);
          dep.loc.index = idx;
          parser.state.current.addDependency(dep);
          return true;
        });
			});

      compilation.moduleTemplate.plugin("render", (source, module, chunk, dependencyTemplates) => {
        var shouldInsertAssigns = this.moduleShouldInsertAssigns.get(module);
        if(!shouldInsertAssigns.size) return source;
        var ast = this.moduleAST.get(module);
        var insertHelper = new AssignInsertHelper(shouldInsertAssigns, ast, source, module);
        this.moduleShouldInsertAssigns.delete(module);
        this.moduleAST.delete(module);
        return insertHelper.apply();
      });
		});
	}
};
