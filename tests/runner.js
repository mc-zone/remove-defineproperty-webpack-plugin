var vm = require("vm");

module.exports = function(script, sandbox){
  vm.createContext(sandbox);
  return vm.runInContext(script, sandbox);
}
