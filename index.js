var NullFactory = require("webpack/lib/NullFactory");
var HarmonyExportAssignDependency = require("./lib/HarmonyExportAssignDependency");
var HarmonyExportSpecifierAssignDependency = require("./lib/HarmonyExportSpecifierAssignDependency");
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
  setup(compilation){
    compilation.dependencyFactories.set(HarmonyExportAssignDependency, new NullFactory());
    compilation.dependencyFactories.set(HarmonyExportSpecifierAssignDependency, new NullFactory());
    compilation.dependencyTemplates.set(HarmonyExportAssignDependency, new HarmonyExportAssignDependency.Template());
    compilation.dependencyTemplates.set(HarmonyExportSpecifierAssignDependency, new HarmonyExportSpecifierAssignDependency.Template());
  }

	apply(compiler){
		compiler.plugin("compilation", (compilation, data) => {
      this.setup(compilation);
      
			data.normalModuleFactory.plugin("parser", (parser, options) => {
				parser.plugin("program", (ast, comments) => {
          this.currentAST = ast;
          var module = parser.state.current;
          this.moduleAST.set(module, ast);
          this.moduleShouldInsertAssigns.set(module, new Set());
				});
        
				parser.plugin("export", (statement) => {
          if(this.shouldExportAssignDirectly(statement)){
            var module = parser.state.current;
            var ast = this.moduleAST.get(module);
            var Dependency;
            if(statement.declaration){
              Dependency = HarmonyExportAssignDependency;
            }else{
              Dependency = HarmonyExportSpecifierAssignDependency;
            }
            var nameSet = this.moduleShouldInsertAssigns.get(module);
            Dependency.getExportedNames(statement).forEach(name => nameSet.add(name));
            var dep = new Dependency(statement, module, ast.range); 
            module.addDependency(dep);
            return true;
          }
        });

        parser.plugin("export specifier", (statement, id, name, idx) => {
          //do not insert __webpack_require__.d()
          if(this.shouldExportAssignDirectly(statement)){
            return true;
          } 
				});

				parser.plugin("export declaration", (statement) => {
          //do not insert __webpack_require__.d()
          if(this.shouldExportAssignDirectly(statement)){
            return true;
          } 
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
