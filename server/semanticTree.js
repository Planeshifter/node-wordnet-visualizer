var Promise = require("bluebird");
var _ = require("underscore");
var util = require("util");
var memoize = require("./memoize.js");
var ndarray = require("ndarray");
var ops = require("ndarray-ops");
var ndbits = require("ndarray-bit");

module.exports = function constructSynsetData(word){
  //console.log(word)
  var synsetArr = word.synsets;
  var count = word.count;

  var ancestorsArrays = synsetArr.map(function(bs){
    var ret = [];
    function createAncestorArr(synset, arr){
      arr.push(synset);
      if (synset.hypernym[0]){
        createAncestorArr(synset.hypernym[0], arr)
      } else {
        ret = arr;
      }
    }

    createAncestorArr(bs, []);
    return ret;
  })

  word.tree = createTree(ancestorsArrays);
  return word;
}

function createTree(ancestorsArrays){
  var tree = new Tree();
  for (var i = 0; i < ancestorsArrays.length; i++){
    var currentArr = ancestorsArrays[i];
    console.log(currentArr)
    var n = currentArr.length;
    while (n--){
      var parent = currentArr[n+1];
     // console.log(parent)
      var synset = currentArr[n];
      if (tree.root.children.length === 0) {
        tree.root.appendChild(synset);
      } else {
          if(parent === undefined){
            tree.root.appendChild(synset);
          } else {
          var target = tree.jumpTo(parent);
          // console.log(synset)
        //console.log(parent.synsetid + " Jump to")
        //console.log(target)
          target.appendChild(synset);
          }
      }
    }
  }

}

function Tree(){
  var self = this;
  this.root = new TreeNode();

  this.jumpTo =  function(data){
    var targetID = data.synsetid;
   // console.log(this.root.children[0].children)
   //console.log('TARGET:' + data.synsetid)
   //Console.log(util.inspect(self, null,7))
    return self.searchTree(self.root, "synsetid", targetID);
  },

  this.searchTree = function(node, key, value){
    console.log(node.data[key])
     if(node.data && node.data[key] == value){
          return node;
     } else if (node.children.length !== 0){
          var result = null;
         // console.log(node.children.length)
          for(var i=0; result == null && i < node.children.length; i++){
               // console.log(node.children[i].data.synsetid)
              //  console.log("i:" + i)
               result = self.searchTree(node.children[i], key, value);
          }
          return result;
     }
     return null;
  }

  this.mergeTree = function(tree){
    function mergeChildren(node){
      var childs = node.children;
      childs.forEach(function(elem){
        var target = self.jumpTo(node); 
        if (target.selectChildrenByKey("synsetid", elem.data.synsetid)) {
          
        }
        else {
          target.appendChildNode(elem);
        }
        }
      });
    }
    mergeChildren(tree.root);
  }
}

function TreeNode(data, parent){
  this.parent = parent || null;
  this.children = [];
  this.data = data || {};
  delete this.data.hypernym;
}

TreeNode.prototype = {
  constructor: TreeNode,
  appendChild: function(data){
    var insertNode = new TreeNode(data, this);

    var alreadyPresent = this.children.some(function(node){
      return _.isEqual(node.data, data);
    });

    if (!alreadyPresent) this.children.push(insertNode);
    else console.log('ist schon da')
  },
  appendChildNode: function(insertNode){
    var alreadyPresent = this.children.some(function(node){
      return _.isEqual(node.data, insertNode.data);
    });
    if (!alreadyPresent) this.children.push(insertNode);
    else console.log('ist schon da')
  },
  selectChildrenByKey: function(key, value){
    return this.children.filter(function(elem){
      return elem[key] === value;
    });
  }
}

/*
  function constructWordData(synsetsTree){
    var ret = Promise.all(synsetsTree).map(synsetArrays => {
      return constructSynsetData(synsetArrays)
    });
    return ret;
  }

  function constructSynsetData(synsetsArr){

    console.log(synsetsArr)

      var adjMatrix = ndbits([100, 100]);
          var synsets = [];

          function processObject(obj){
            if (obj.hypernym.length !== 0){
              if (!idStore.some(id => id === obj.hypernym[0].synsetid)){
                idStore.push(obj.hypernym[0].synsetid);
              }
              if (!idStore.some(id => id === obj.synsetid)){
                idStore.push(obj.synsetid);
              }

              var parentIndex = idStore.indexOf(obj.hypernym[0].synsetid);
              var childIndex = idStore.indexOf(obj.synsetid);
          adjMatrix.set(parentIndex, childIndex, true);
        }

          var selectedSynset = synsets.filter(elem => elem.synsetid == obj.synsetid);
          if (selectedSynset.length === 0){
          synsets.push(obj);
          }
          if (obj.hypernym.length !== 0) processObject(obj.hypernym[0]);
          return;
        }

        synsetsArr.forEach(synset => processObject(synset));
      var data = {};
      data.synsets = synsets.map(elem => {
        if (!elem.hypernym) elem.root = true
        else elem.root = false;
        elem.counter = 1;
        return elem;
      });
      data.adjMatrix = adjMatrix;
        return data;
  }

*/
