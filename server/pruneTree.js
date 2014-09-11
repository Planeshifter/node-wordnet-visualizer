module.exports = function pruneTree(tree, treshold){
  for (var keys in tree){
    var node = tree[keys];
    if (node.count < treshold) delete tree[keys]; 
  }
  return tree;
}
