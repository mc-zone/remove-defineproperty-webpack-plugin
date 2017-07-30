var vm = require("vm");

module.exports = function(script, sandbox){
  vm.createContext(sandbox);
  vm.runInContext("Object.defineProperty = null;", sandbox);
  return vm.runInContext(script, sandbox);
};
