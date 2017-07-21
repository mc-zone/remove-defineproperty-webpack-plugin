var NullFactory = require("webpack/lib/NullFactory");
var HarmonyExportAssignDependency = require("./lib/HarmonyExportAssignDependency");
var HarmonyExportSpecifierAssignDependency = require("./lib/HarmonyExportSpecifierAssignDependency");
var ReferenceReplaceHelper = require("./lib/ReferenceReplaceHelper");
var util = require("./lib/util");

module.exports = class RemoveDefinePropertyWebpackPlugin {
	constructor(options){
		this.options = options;
    this.moduleAST = new Map();
    this.moduleShouldReplaceReferences = new Map();
	}

  shouldExportAssignDirectly(statement){
    var declaration = statement.declaration;
    var specifiers = statement.specifiers;
    return (
      (declaration && !util.isImmutableStatement(declaration) && declaration.type == "VariableDeclaration") || 
      (!declaration && specifiers)
    )
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
          this.moduleShouldReplaceReferences.set(module, new Set());
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
            var nameSet = this.moduleShouldReplaceReferences.get(module);
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
        var shouldReplaceReferences = this.moduleShouldReplaceReferences.get(module);
        var ast = this.moduleAST.get(module);
        if(!shouldReplaceReferences.size) return source;
        var referenceReplacer = new ReferenceReplaceHelper(shouldReplaceReferences, ast, source, module);
        this.moduleShouldReplaceReferences.delete(module);
        this.moduleAST.delete(module);
        return referenceReplacer.replace();
      });
		});
	}

  /*
	handleModuleAST(module, ast){
    console.log(module)
    console.log(`walk module: ${module.request}`);
		ast.body.forEach(node => this.walkNode(node))
	}

	walkNode(node){
		switch(node.type){
		  case "ExportNamedDeclaration":
			this.walkExportDeclaration(node);
			break;
		}

	}
  */

	checkExportDeclaration(node){
		var declaration = node.declaration;
		if(isImmutableStatement(node)){
    }

    var content = declaration.declarations[0];
    var id = content.id;
    var init = content.init;
    console.log(declaration)
    
    var code = `console.log("abc");`;
    var newNode = this.parser.evaluate(code);
    console.log(newNode)
	}
}


