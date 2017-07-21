var ReplaceSource = require("webpack-sources").ReplaceSource;
var CachedSource = require("webpack-sources").CachedSource;


module.exports = class ReferenceReplaceHelper {
  constructor(references, ast, source, module){
    this.references = references;
    this.ast = ast;
    this.source = source;
    this.replaceSource = source.replace ? source : source._source;
    this.exportsArgument = module.exportsArgument;

    console.log(Array.from(references))
  }

  loop(values, fn){
    var length = values.length;
    var rst;
    for (var i = 0; i < length; i++) {
      rst = fn.call(this, values[i]);
      if(typeof rst !== "undefined"){
        break;
      }
    }
    return rst;
  }

  /*
   * foo => __webpack_exports__["foo"]
   */
  replace(){
    try{
      var formals = new Set();
      this.loop.call(this, this.ast.body, block => this.walkStatement(block, formals));
    }catch(e){
      console.error(e.stack)
    }
    return this.source;
  }

  replaceIdentifier(identifier, name){
    this.replaceSource.replace(identifier.start, identifier.end - 1, `${this.exportsArgument}["${name}"]`); 
  }

  mergeParamsToFormals(formals, params){
    var newFormals = new Set(Array.from(formals));
    this.loop(params, param => {
      param.type === "Identifier" && newFormals.add(param.name);
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
    if(declaration){
      return this.loop(declaration.declarations, dec => {
        //no need to touch export id again, just handle the init
        if(dec.init){
          return this.walkStatement(dec.init, formals);
        }
      });
    }else if(specifiers && specifiers.length){
      //TODO
      return this.walkStatement(specifiers, formals);
    }
  }

  walkExpressionStatement(statement, formals){
    return this.walkStatement(statement.expression, formals);
  }

  walkAssignmentExpression(expression, formals){
    var left = expression.left;
    if(left.type === "Identifier" && !formals.has(left.name) && this.references.has(left.name)){
      this.replaceIdentifier(left, left.name);
    }
  }

  walkArrowFunctionExpression(expression, formals){
    return this._walkFunction(expression, formals);
  }

  walkFunctionDeclaration(declaration, formals){
    return this._walkFunction(declaration, formals);
  }

  walkBlockStatement(statement, formals){
    return this.loop.call(this, statement.body, block => this.walkStatement(block, formals));
  }

  walkLiteral(Literal, formals){
  }

  _walkFunction(expression, formals){
    if(expression.params.length){
      formals = this.mergeParamsToFormals(formals, expression.params);
    }

    return this.walkStatement(expression.body, formals);
  }

}
