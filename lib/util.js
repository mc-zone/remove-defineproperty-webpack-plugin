module.exports = {
  isImmutableStatement: function(statement) {
    if(statement.type === "FunctionDeclaration") return true;
    if(statement.type === "ClassDeclaration") return true;
    if(statement.type === "VariableDeclaration" && statement.kind === "const") return true;
    return false;
  },

  isHoistedStatement: function(statement) {
    if(statement.type === "FunctionDeclaration") return true;
    return false;
  }
};
