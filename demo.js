var path = require("path");
var builder = require("./tests/builder");

builder(path.resolve(__dirname, "./tests/setter/modifyvar/condition.js")).then(content => console.log(content));
