"use strict";

var ReplaceSource = require("webpack-sources").ReplaceSource;
var OriginalSource = require("webpack-sources").OriginalSource;

var NullFactory = require("webpack/lib/NullFactory");
var HarmonyModulesHelpers = require("webpack/lib/dependencies/HarmonyModulesHelpers");
var acorn = require("acorn-dynamic-import").default;
var HarmonyCompatibilityDependency = require("./lib/HarmonyCompatibilityDependency");
var HarmonyExportSpecifierAssignDependency = require("./lib/HarmonyExportSpecifierAssignDependency");
var HarmonyExportImportedSpecifierAssignDependency = require("./lib/HarmonyExportImportedSpecifierAssignDependency");
var SetterInsertHelper = require("./lib/SetterInsertHelper");
var util = require("./lib/util");

module.exports = class RemoveDefinePropertyWebpackPlugin {
  constructor(options){
    this.options = options;
    this.moduleAST = new Map();
    this.moduleShouldInsertSetters = new Map();
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

  replaceExtension(source, requireFn){
    var replaceSource = new ReplaceSource(new OriginalSource(source));

    var ast = acorn.parse(source, {
      ranges: true,
      locations: true,
      ecmaVersion: 2017,
      sourceType: "script",
      plugins: {
        dynamicImport: true
      },
    });

    ast.body.forEach(statement => {
      if(statement.type === "ExpressionStatement"){
        var expression = statement.expression;
        if(expression.type === "AssignmentExpression"){
          var left = expression.left;
          var right = expression.right;
          if(left.type === "MemberExpression" && left.object.name === requireFn){
            if(left.property.name === "d"){
              var requireD = [
                "function(exports, name, getter) {",
                `    if(!${requireFn}.o(exports, name)) {`,
                "        exports[name] = getter();",
                "    }",
                "}",
              ].join("\n");
              replaceSource.replace(right.start, right.end - 1, requireD);
            }
          }
        }
      }
    });

    return replaceSource.source();
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
          this.moduleAST.set(module, ast);
          this.moduleShouldInsertSetters.set(module, new Map());
          process.nextTick(() => {
            this.modifyCompatibility(module);
          });
        });

        parser.plugin("export specifier", (statement, id, name, idx) => {
          if(this.shouldExportAssignDirectly(statement)){
            var module = parser.state.current;
            var dep = new HarmonyExportSpecifierAssignDependency(module, id, name, statement);
            var nameMap = this.moduleShouldInsertSetters.get(module);
            module.addDependency(dep);
            nameMap.set(id, name);
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
        var shouldInsertSetters = this.moduleShouldInsertSetters.get(module);
        if(!shouldInsertSetters.size) return source;
        var ast = this.moduleAST.get(module);
        var insertHelper = new SetterInsertHelper(shouldInsertSetters, ast, source, module);
        this.moduleShouldInsertSetters.delete(module);
        this.moduleAST.delete(module);
        return insertHelper.apply();
      });

      compilation.mainTemplate.plugin("require-extensions", (source, chunk, hash) => {
        return this.replaceExtension(source, compilation.mainTemplate.requireFn);
      });
    });
  }
};
