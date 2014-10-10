var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var util = require("util");
var _ = require("underscore");

var analyzeCorpus = require("./synsetRepresentation.js");
var constructSynsetData = require("./idea.js");
var mergeWordTrees = require("./mergeWordTrees.js");
var pruneTree = require("./pruneTree.js");
var pickSynsets = require("./pickSynsets.js");
var mergeDocTrees = require("./mergeDocTrees.js");
var propagateWords = require("./propagateWords.js");
var logger = require("./logger");

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
    if(child.flagged === true && child.parentId !== "root"){
      var insertNode = getNonFlaggedChild(child);
      current.children = current.children.filter(function(e){
        return e.data.synsetid !== child.data.synsetid;
      });
      current.children.push(insertNode);
      removeFlaggedNodes(insertNode);
    } else {
      removeFlaggedNodes(child);
    }
  });
}

function formD3Tree(tree){
// initialize child arrays
  for (var key in tree){
  	tree[key].children = [];
  }
  tree["root"] = {};
  tree["root"].children = [];

  for (var key in tree){
    var currentNode = tree[key];
    if (currentNode.parentId && tree[currentNode.parentId]){
    	tree[currentNode.parentId].children.push(currentNode);
	}
  }
  walkTree(tree["root"], null);
  removeFlaggedNodes(tree["root"]);
  return tree["root"];
}

module.exports = function getD3Tree(corpus, treshold){
  var wordTreshold = treshold || 1;
  //console.log(corpus)
  var corpusTreePromise = analyzeCorpus(corpus).then(function(corpus){
  	var docTrees = corpus.map(function(d){
    	var wordTrees = d.map(function(w){
      		return constructSynsetData(w);
    	});
    	return mergeWordTrees(wordTrees);
  	});
  	docTrees = docTrees.map(function(d){
  		return pickSynsets(d);
  	});
  	docTrees = docTrees.map(function(d){
    	return pruneTree(d, wordTreshold);
  	});

  	var finalTree = mergeDocTrees(docTrees);
    return propagateWords(finalTree);
  });

  return corpusTreePromise.then(function(data){
    var ret = formD3Tree(data);
    //console.log(util.inspect(ret, null, 4));
    return ret;
  });
};
