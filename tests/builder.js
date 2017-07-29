var webpack = require("webpack");
var MemoryFS = require("memory-fs");
var RemoveDefineproperyPlugin = require("../");

var fs = new MemoryFS();

module.exports = function(entryFilePath){
  return new Promise((resolve, reject) => {
    var config = {
      entry:entryFilePath,
      output:{
        path:"/",
        filename:"[hash].js",
        pathinfo:true,
      },

      plugins:[
        new RemoveDefineproperyPlugin()
      ]
    }

    var compiler = webpack(config);
    compiler.outputFileSystem = fs;
    compiler.run(function(err, stats){
      if(err){
        return reject((err.stack||err) + (err.details || ''));
      }else if(stats.hasErrors()){
        return reject(stats.toJson().errors);
      }
      var hash = stats.toJson().hash;

      fs.readFile(`/${hash}.js`, "utf8", (err, content) => {
        if(err){
          return reject(err);
        }
        //console.log(content)
        resolve(content);
      });
    });
  });
}
