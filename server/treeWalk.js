var util = require("util");

function walkTree(current, parent){
    if(current.children.length === 1 && parent !== null){
      var child = current.children[0];
      walkTree(child, current);
      current.flagged = true;
      return;
    }
    if(current.children.length === 0){
      return;
    }
    if(current.children.length > 1 || parent === null){
      current.children.forEach(function(child){
        walkTree(child, current);
      });
      return;
    }
}

function getNonFlaggedChild(node){
  if (node.children[0].flagged === true){
    return getNonFlaggedChild(node.children[0]);
  } else {
    return node.children[0];
  }
}

function removeFlaggedNodes(current){
  //console.log(current.children)
  current.children.forEach(function(child){
    if(child.flagged === true){
      var insertNode = getNonFlaggedChild(child);
      current.children = current.children.filter(function(e){
        return e.name !== child.name;
      });
      current.children.push(insertNode);
      removeFlaggedNodes(current);
    }
  });
}

var tree = {name:"root", children: [{name: "child1", children : [{name:"grandchild", children : [{name: "grandgrandchild", children: [{name:"gggchild", children:[]}]}]}]},{name:"child2", children:[]}]}

walkTree(tree, null);

removeFlaggedNodes(tree)

console.log(util.inspect(tree, null, 9))
