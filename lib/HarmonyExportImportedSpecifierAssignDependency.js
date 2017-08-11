"use strict";

var HarmonyModulesHelpers = require("webpack/lib/dependencies/HarmonyModulesHelpers");
var HarmonyExportImportedSpecifierDependency = require("webpack/lib/dependencies/HarmonyExportImportedSpecifierDependency");

class HarmonyExportImportedSpecifierAssignDependency extends HarmonyExportImportedSpecifierDependency {
}


HarmonyExportImportedSpecifierAssignDependency.Template = class HarmonyExportImportedSpecifierAssignDependencyTemplate extends HarmonyExportImportedSpecifierDependency.Template {

  getContent(dep) {
    const name = dep.importedVar;
    const used = dep.originModule.isUsed(dep.name);
    const importedModule = dep.importDependency.module;
    const active = HarmonyModulesHelpers.isActive(dep.originModule, dep);
    const importsExportsUnknown = !importedModule || !Array.isArray(importedModule.providedExports);

    const getReexportStatement = this.reexportStatementCreator(dep.originModule, importsExportsUnknown, name);

    // we want to rexport something, but the export isn't used
    if(!used) {
      return "/* unused harmony reexport " + dep.name + " */\n";
    }

    // we want to reexport something but another exports overrides this one
    if(!active) {
      return "/* inactive harmony reexport " + (dep.name || "namespace") + " */\n";
    }

    // we want to reexport the default export from a non-hamory module
    const isNotAHarmonyModule = !(importedModule && (!importedModule.meta || importedModule.meta.harmonyModule));
    if(dep.name && dep.id === "default" && isNotAHarmonyModule) {
      return "/* harmony reexport (default from non-hamory) (assign) */ " + getReexportStatement(JSON.stringify(used), null);
    }

    // we want to reexport a key as new key
    if(dep.name && dep.id) {
      var idUsed = importedModule && importedModule.isUsed(dep.id);
      return "/* harmony reexport (binding) (assign) */ " + getReexportStatement(JSON.stringify(used), JSON.stringify(idUsed));
    }

    // we want to reexport the module object as named export
    if(dep.name) {
      return "/* harmony reexport (module object) (assign) */ " + getReexportStatement(JSON.stringify(used), "");
    }

    // we know which exports are used
    if(Array.isArray(dep.originModule.usedExports)) {
      const activeExports = HarmonyModulesHelpers.getActiveExports(dep.originModule, dep);
      const items = dep.originModule.usedExports.map(function(id) {
        if(id === "default") return;
        if(activeExports.indexOf(id) >= 0) return;
        if(importedModule.isProvided(id) === false) return;
        var exportUsed = dep.originModule.isUsed(id);
        var idUsed = importedModule && importedModule.isUsed(id);
        return [exportUsed, idUsed];
      }).filter(Boolean);

      if(items.length === 0) {
        return "/* unused harmony namespace reexport */\n";
      }

      return items.map(function(item) {
        return "/* harmony namespace reexport (by used) */ " + getReexportStatement(JSON.stringify(item[0]), JSON.stringify(item[1]));
      }).join("");
    }

    // not sure which exports are used, but we know which are provided
    if(dep.originModule.usedExports && importedModule && Array.isArray(importedModule.providedExports)) {
      const activeExports = HarmonyModulesHelpers.getActiveExports(dep.originModule, dep);
      const items = importedModule.providedExports.map(function(id) {
        if(id === "default") return;
        if(activeExports.indexOf(id) >= 0) return;
        var exportUsed = dep.originModule.isUsed(id);
        var idUsed = importedModule && importedModule.isUsed(id);
        return [exportUsed, idUsed];
      }).filter(Boolean);

      if(items.length === 0) {
        return "/* empty harmony namespace reexport */\n";
      }

      return items.map(function(item) {
        return "/* harmony namespace reexport (by provided) */ " + getReexportStatement(JSON.stringify(item[0]), JSON.stringify(item[1]));
      }).join("");
    }

    // not sure which exports are used and provided
    if(dep.originModule.usedExports) {
      const activeExports = HarmonyModulesHelpers.getActiveExports(dep.originModule, dep);
      let content = "/* harmony namespace reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in " + name + ") ";

      // Filter out exports which are defined by other exports
      // and filter out default export because it cannot be reexported with *
      if(activeExports.length > 0)
        content += "if(" + JSON.stringify(activeExports.concat("default")) + ".indexOf(__WEBPACK_IMPORT_KEY__) < 0) ";
      else
        content += "if(__WEBPACK_IMPORT_KEY__ !== 'default') ";
      const exportsName = dep.originModule.exportsArgument || "exports";
      return content + `(function(key) { ${exportsName}[key] = ${name}[key]; }(__WEBPACK_IMPORT_KEY__));\n`;
    }

    return "/* unused harmony reexport namespace */\n";
  }

  reexportStatementCreator(module, importsExportsUnknown, name) {
    const exportsName = module.exportsArgument || "exports";
    const getReexportStatement = (key, valueKey) => {
      const conditional = this.getConditional(importsExportsUnknown, valueKey, name);
      const returnValue = this.getReturnValue(valueKey);
      return `${conditional}${exportsName}[${key}] = ${name}${returnValue};\n`;
    };
    return getReexportStatement;
  }
};

module.exports = HarmonyExportImportedSpecifierAssignDependency;
