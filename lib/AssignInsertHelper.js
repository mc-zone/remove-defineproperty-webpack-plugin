var ReplaceSource = require("webpack-sources").ReplaceSource;
var CachedSource = require("webpack-sources").CachedSource;


module.exports = class AssignInsertHelper {
  constructor(assigns, ast, source, module){
    this.assigns = assigns;
    this.ast = ast;
    this.source = source;
    this.replaceSource = source.replace ? source : source._source;
    this.exportsArgument = module.exportsArgument;

    console.log("need insert:", Array.from(assigns))
  }

  loop(values, fn, args){
    var length = values.length;
    if(!args){
      args = [];
    }else if(!args instanceof Array){
      args = [args];
    }
    var rst;
    for (var i = 0; i < length; i++) {
      rst = fn.apply(this, [values[i]].concat(args));
      if(typeof rst !== "undefined"){
        break;
      }
    }
    return rst;
  }

  /*
   * foo = "xxx";
   * foo = __webpack_exports__["foo"] = "xxx";
   */
  apply(){
    try{
      var ignores = new Set();
      this.loop.call(this, this.ast.body, this.walkStatement, ignores);
    }catch(e){
      console.error(e.stack)
    }
    return this.source;
  }

  insertIdentifier(identifier, name){
    this.replaceSource.insert(identifier.end, ` = ${this.exportsArgument}["${name}"]`); 
  }

  mergeParamsToIgnores(ignores, params){
    var newFormals = new Set(Array.from(ignores));
    this.loop(params, param => {
      if(param.type === "Identifier"){
        newFormals.add(param.name);
      }else if(param.type === "ObjectPattern"){
        this.loop(param.properties, property => {
          if(property.type === "Property" && property.key && property.key.type === "Identifier"){
            newFormals.add(property.key.name);
          }
        });
      }
    });
    return newFormals;
  }

  walkStatement(statement, ignores){
    if(!ignores) throw new Error("ignore list missing!");
    if(statement instanceof Array){
      return this.loop.call(this, statement, this.walkStatement, ignores);
    }
    var handler = this[`walk${statement.type}`];
    if(handler){
      return handler.call(this, statement, ignores);
    }else{
      console.warn(`Missing type: ${statement.type}`, statement);
    }
  }

  walkExportNamedDeclaration(statement, ignores){
    var declaration = statement.declaration;
    var specifiers = statement.specifiers;
    if(declaration && declaration.type === "VariableDeclaration" && declaration.declarations.length){
      //no need to touch export id again, just handle the init
      this.loop(declaration.declarations, this._walkInit, ignores);
    }else{
      this.walkStatement(declaration, ignores);
    }

    if(specifiers && specifiers.length){
      return this.walkStatement(specifiers, ignores);
    }
  }

  walkExportSpecifier(expression, ignores){
  }

  walkExpressionStatement(statement, ignores){
    return this.walkStatement(statement.expression, ignores);
  }

  walkAssignmentExpression(expression, ignores){
    var left = expression.left;
    if(left.type === "Identifier" && !ignores.has(left.name) && this.assigns.has(left.name)){
      this.insertIdentifier(left, left.name);
    }
    this.walkStatement(expression.right, ignores);
  }

  walkVariableDeclaration(declaration, ignores){
    if(declaration.declarations.length){
      return this.loop(declaration.declarations, this._walkInit, ignores);
    }
  }

  walkObjectExpression(expression, ignores){
    if(expression.properties && expression.properties.length){
      //just need handle value, ignore prop key
      this.loop(expression.properties, property => {
        if(property.type === "Property" && property.value){
          return this.walkStatement(property.value, ignores);
        }
      });
    }
  }

  walkReturnStatement(statement, ignores){
    if(statement.argument){
      return this.walkStatement(statement.argument, ignores);
    }
  }

  walkArrowFunctionExpression(expression, ignores){
    return this._walkFunction(expression, ignores);
  }

  walkFunctionDeclaration(declaration, ignores){
    return this._walkFunction(declaration, ignores);
  }

  walkFunctionExpression(expression, ignores){
    return this._walkFunction(expression, ignores);
  }

  walkCallExpression(expression, ignores){
    this.loop(expression.arguments, this.walkStatement, ignores);
    this.walkStatement(expression.callee, ignores);
  }

  walkMemberExpression(expression, ignores){
    this.walkStatement(expression.object, ignores);
    if(expression.computed){
      this.walkStatement(exports.property, ignores);
    }
  }

  walkBlockStatement(statement, ignores){
    /**
     * TODO VariableDeclaration hoist
     * var b = 1;
     * function a(){
     *  b = 2;
     *  if(false){
     *    var b = 3;
     *  }
     * }
     * a();
     */
    return this.loop(statement.body, this.walkStatement, ignores);
  }

  walkIfStatement(statement, ignores){
    this.walkStatement(statement.test, ignores);
    this.walkStatement(statement.consequent, ignores);
    if(statement.alternate){
      this.walkStatement(statement.alternate, ignores);
    }
  }

  walkIdentifier(identifier, ignores){
  }

  walkLiteral(literal, ignores){
  }

  _walkFunction(expression, ignores){
    if(expression.params.length){
      ignores = this.mergeParamsToIgnores(ignores, expression.params);
    }
    return this.walkBlockStatement(expression.body, ignores);
  }

  _walkInit(declaration, ignores){
    if(declaration.init){
      return this.walkStatement(declaration.init, ignores);
    }
  }

}
