var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var util = require("util");
var _ = require("underscore");

var analyzeCorpus = require("./synsetRepresentation.js");
var constructSynsetData = require("./idea.js");
var mergeWordTrees = require("./mergeWordTrees.js")
var pruneTree = require("./pruneTree.js")
var pickSynsets = require("./pickSynsets.js")
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

module.exports = function getD3Tree(corpus, treshold){
  var wordTreshold = treshold || 1;
  console.log(corpus)
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
  	return mergeDocTrees(docTrees);
  })

  return corpusTreePromise.then(function(data){
    var ret = formD3Tree(data);
    //console.log(util.inspect(ret, null, 4));
    return ret;
  })
}	
