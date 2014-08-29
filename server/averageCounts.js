var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var _ = require("underscore");
var util = require("util");

module.exports = function attachAverageCounts(tree){

  tree.forEach(function(root){
    
    function traverseTree(root){
      root.children.forEach(function(child){
        child.counter = this.counter + child.counter;
        child.depth = this.depth ? this.depth + 1 : 1;
        traverseTree(child);
      }, root);
    }

    traverseTree(root);
  });
  
  console.log(util.inspect(tree, null, 20))

}