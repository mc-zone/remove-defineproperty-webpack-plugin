var ReplaceSource = require("webpack-sources").ReplaceSource;
var CachedSource = require("webpack-sources").CachedSource;


module.exports = class AssignInsertHelper {
  constructor(assigns, ast, source, module){
    this.assigns = assigns;
    this.ast = ast;
    this.source = source;
    this.replaceSource = source.replace ? source : source._source;
    this.exportsArgument = module.exportsArgument;

    console.log(Array.from(assigns))
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
      var formals = new Set();
      this.loop.call(this, this.ast.body, this.walkStatement, formals);
    }catch(e){
      console.error(e.stack)
    }
    return this.source;
  }

  insertIdentifier(identifier, name){
    this.replaceSource.insert(identifier.end, ` = ${this.exportsArgument}["${name}"]`); 
  }

  mergeParamsToFormals(formals, params){
    var newFormals = new Set(Array.from(formals));
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

  walkStatement(statement, formals){
    if(!formals) throw new Error("formal parameters list missing!");
    if(statement instanceof Array){
      return this.loop.call(this, statement, this.walkStatement, formals);
    }
    var handler = this[`walk${statement.type}`];
    if(handler){
      return handler.call(this, statement, formals);
    }else{
      console.warn(`Missing type: ${statement.type}`, statement);
    }
  }

  walkExportNamedDeclaration(statement, formals){
    var declaration = statement.declaration;
    var specifiers = statement.specifiers;
    if(declaration && declarations.length){
      //no need to touch export id again, just handle the init
      return this.loop(declaration.declarations, this._walkInit, formals);
    }
    if(specifiers && specifiers.length){
      //TODO
      return this.walkStatement(specifiers, formals);
    }
  }

  walkExpressionStatement(statement, formals){
    return this.walkStatement(statement.expression, formals);
  }

  walkAssignmentExpression(expression, formals){
    var left = expression.left;
    if(left.type === "Identifier" && !formals.has(left.name) && this.assigns.has(left.name)){
      this.insertIdentifier(left, left.name);
    }
    this.walkStatement(expression.right, formals);
  }

  walkVariableDeclaration(declaration, formals){
    if(declaration.declarations.length){
      return this.loop(declaration.declarations, this._walkInit, formals);
    }
  }

  walkArrowFunctionExpression(expression, formals){
    console.log(expression)
    return this._walkFunction(expression, formals);
  }

  walkFunctionDeclaration(declaration, formals){
    return this._walkFunction(declaration, formals);
  }

  walkFunctionExpression(expression, formals){
    return this._walkFunction(expression, formals);
  }

  walkBlockStatement(statement, formals){
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
    return this.loop(statement.body, this.walkStatement, formals);
  }

  walkLiteral(Literal, formals){
  }

  _walkFunction(expression, formals){
    if(expression.params.length){
      formals = this.mergeParamsToFormals(formals, expression.params);
    }
    return this.walkBlockStatement(expression.body, formals);
  }

  _walkInit(declaration, formals){
    if(declaration.init){
      return this.walkStatement(declaration.init, formals);
    }
  }

}
