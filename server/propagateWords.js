var _ = require("underscore");

module.exports = function propagateWords(tree){
  for (var key in tree){
    var node = tree[key];
    if (node.isLeaf === true ){
      var current_ancestors = node.data.ancestors;
      current_ancestors.forEach(function(id){
        var parent = tree[id];
        parent.words ? parent.words = parent.words.concat(node.words) : parent.words = node.words;
      });
    }
  }
  for (var key in tree){
    var node = tree[key];
    if (node.words) node.words = _.countBy(node.words);
  }
  return tree;
}
