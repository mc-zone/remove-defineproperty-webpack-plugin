"use strict";

class SetterInsertHelper {
  constructor(setters, ast, source, module){
    this.setters = setters;
    this.ast = ast;
    this.source = source;
    this.replaceSource = source.replace ? source : source._source;
    this.exportsArgument = module.exportsArgument;

  }

  loop(values, fn, args){
    var length = values.length;
    if(!args){
      args = [];
    }else if(!Array.isArray(args)){
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

  apply(){
    try{
      var ignores = new Set();
      this.loop.call(this, this.ast.body, this.walkStatement, ignores);
    }catch(e){
      console.error(e.stack);
    }
    return this.source;
  }

  /*
   * foo = "xxx"
   * foo = __webpack_exports__["foo"] = "xxx"
   */
  insertAssign(identifier, id, name){
    this.replaceSource.insert(identifier.end, ` = ${this.exportsArgument}["${name}"]`); 
  }

  /*
   * foo++
   * (__webpack_exports__["foo"]++, foo++)
   */
  appendUpdate(expression, id, name){
    var update = `${this.exportsArgument}["${name}"]`;
    if(expression.prefix){
      update = expression.operator + update;
    }else{
      update = update + expression.operator;
    }
    this.replaceSource.insert(expression.start, "("); 
    this.replaceSource.insert(expression.start, update); 
    this.replaceSource.insert(expression.start, ","); 
    this.replaceSource.insert(expression.end, ")"); 
  }

  mergeParamsToIgnores(ignores, params){
    var newIgnores = new Set(Array.from(ignores));
    this.loop(params, param => {
      if(param.type === "Identifier"){
        newIgnores.add(param.name);
      }else if(param.type === "ObjectPattern"){
        this.loop(param.properties, property => {
          if(property.type === "Property" && property.key && property.key.type === "Identifier"){
            newIgnores.add(property.key.name);
          }
        });
      }
    });
    return newIgnores;
  }

  mergeVariablesToIgnores(ignores, declarations){
    var newIgnores = new Set(Array.from(ignores));
    this.loop(declarations, declaration => {
      if(declaration.type === "VariableDeclarator"){
        newIgnores.add(declaration.id.name);
      }
    });
    return newIgnores;
  }

  /*
   * find all hoist declarations to ignore.
   * like following (`b` should to be 1, should not modified):
   *
   * var b = 1;
   * function a(){
   *   b = 2;
   *   while(false){
   *     if(false){
   *       var b = 3;
   *     }
   *   }
   * }
   * a();
   *
   */
  findAllHoistDeclarators(scope){
    var ids = new Set();
    var inspect = this._inspectHoistDeclarators.bind(this);

    this.loop(scope, inspect, ids);

    return ids;
  }
  _inspectHoistDeclarators(statement, ids){
    var inspect = this._inspectHoistDeclarators.bind(this);
    switch(statement.type){
      case "BlockStatement":
        this.loop(statement.body, inspect, ids);
        break;
      case "VariableDeclaration":
        if(statement.kind === "var"){
          this.loop(statement.declarations, declarator => {
            ids.add(declarator.id.name);
          });
        }
        break;
      case "FunctionDeclaration":
        ids.add(statement.id.name);
        break;
      case "IfStatement":
        inspect(statement.consequent, ids);
        if(statement.alternate){
          inspect(statement.alternate, ids);
        }
        break;
      case "WhileStatement":
        inspect(statement.body, ids);
        break;
    }
  }

  walkStatement(statement, ignores){
    if(!ignores) throw new Error("ignore list missing!");
    if(Array.isArray(statement)){
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
      this.loop(declaration.declarations, declarator => {
        declarator.init && this.walkStatement(declarator.init, ignores);
      });
    }else if(declaration){
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
    if(left.type === "Identifier" && !ignores.has(left.name) && this.setters.has(left.name)){
      this.insertAssign(left, left.name, this.setters.get(left.name));
    }
    this.walkStatement(expression.right, ignores);
  }

  walkVariableDeclaration(declaration, ignores){
    if(declaration.declarations.length){
      return this.loop(declaration.declarations, this.walkVariableDeclarator, ignores);
    }
  }
  walkVariableDeclarator(declarator, ignores){
    this.walkStatement(declarator.id, ignores);
    if(declarator.init){
      this.walkStatement(declarator.init, ignores);
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

  walkArrayExpression(expression, ignores){
    return this.loop(expression.elements, this.walkStatement, ignores);
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
      this.walkStatement(expression.property, ignores);
    }
  }

  walkBlockStatement(statement, ignores){
    //find out all top scope VariableDeclaration
    //TODO add flag to prevent repeat find in inner scope (pass `state` in place of `ignores`)
    //TODO `let` in common scope
    var hoistDeclarators = this.findAllHoistDeclarators(statement.body);
    if(hoistDeclarators.size){
      ignores = new Set(Array.from(ignores).concat(Array.from(hoistDeclarators)));
    }
    return this.loop(statement.body, this.walkStatement, ignores);
  }

  walkIfStatement(statement, ignores){
    this.walkStatement(statement.test, ignores);
    this.walkStatement(statement.consequent, ignores);
    if(statement.alternate){
      this.walkStatement(statement.alternate, ignores);
    }
  }

  walkWhileStatement(statement, ignores){
    this.walkStatement(statement.test, ignores);
    this.walkBlockStatement(statement.body, ignores);
  }

  walkDoWhileStatement(statement, ignores){
    this.walkStatement(statement.test, ignores);
    this.walkBlockStatement(statement.body, ignores);
  }

  walkSwitchStatement(statement, ignores){
    this.walkStatement(statement.discriminant, ignores);
    this.loop(statement.cases, this.walkSwitchCase, ignores);
  }

  walkSwitchCase(statement, ignores){
    if(statement.test){
      this.walkStatement(statement.test, ignores);
    }
    this.walkStatement(statement.consequent, ignores);
  }

  walkForStatement(statement, ignores){
    var init = statement.init;
    if(init && init.type === "VariableDeclaration" && init.declarations.length){
      ignores = this.mergeVariablesToIgnores(ignores, init.declarations);
    }
    if(init){
      this.walkStatement(init, ignores);
    } 
    if(statement.test){
      this.walkStatement(statement.test, ignores);
    }
    if(statement.update){
      this.walkStatement(statement.update, ignores);
    }
    this.walkBlockStatement(statement.body, ignores);
  }

  walkForInStatement(statement, ignores){
    var left = statement.left;
    if(left && left.type === "VariableDeclaration" && left.declarations.length){
      ignores = this.mergeVariablesToIgnores(ignores, left.declarations);
    }
    if(left){
      this.walkStatement(left, ignores);
    } 
    if(statement.right){
      this.walkStatement(statement.right, ignores);
    }
    this.walkBlockStatement(statement.body, ignores);
  }

  walkLogicalExpression(expression, ignores){
    this.walkStatement(expression.left, ignores);
    this.walkStatement(expression.right, ignores);
  }

  walkBinaryExpression(expression, ignores){
    this.walkStatement(expression.left, ignores);
    this.walkStatement(expression.right, ignores);
  }

  walkUnaryExpression(expression, ignores){
    this.walkStatement(expression.argument, ignores);
  }

  walkUpdateExpression(expression, ignores){
    var argument = expression.argument;
    if(argument.type === "Identifier" && !ignores.has(argument.name) && this.setters.has(argument.name)){
      this.appendUpdate(expression, argument.name, this.setters.get(argument.name));
    }
  }

  walkIdentifier(identifier, ignores){
  }

  walkLiteral(literal, ignores){
  }

  walkBreakStatement(statement, ignores){
  }

  walkEmptyStatement(statement, ignores){
  }

  _walkFunction(statement, ignores){
    if(statement.params.length){
      ignores = this.mergeParamsToIgnores(ignores, statement.params);
    }
    if(statement.body){
      if(statement.expression === true){//body is a expression (i.e. arrow expression)
        return this.walkStatement(statement.body, ignores);
      }else if(statement.body.type === "BlockStatement"){
        return this.walkBlockStatement(statement.body, ignores);
      }
    }
  }
}

module.exports = SetterInsertHelper;
