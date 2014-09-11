var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");

var _ = require("underscore");

var analyzeCorpus = require("./synsetRepresentation.js");
var constructSynsetData = require("./idea.js");
var mergeWordTrees = require("./mergeWordTrees.js")
var pruneTree = require("./pruneTree.js")
var mergeDocTrees = require("./mergeDocTrees.js")

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
  return tree["root"];
}

module.exports = function getD3Tree(corpus){
  var corpusTreePromise = analyzeCorpus(corpus).then(function(corpus){
  	var docTrees = corpus.map(function(d){
    	var wordTrees = d.map(function(w){
      		return constructSynsetData(w);
    	});
    	return mergeWordTrees(wordTrees);
  	});
  	console.log(docTrees)
  	//docTrees = docTrees.map(function(d){
    //	return pruneTree(d, 2);
  	//});
  	return mergeDocTrees(docTrees);
  })

  return corpusTreePromise.then(function(data){
    var ret = formD3Tree(data);
    console.log(ret)
    return ret;
  })
}	
