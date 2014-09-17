var util = require("util");
var args = process.argv.slice(2);

var analyzeCorpus = require("./synsetRepresentation.js");
var constructSynsetData = require("./idea.js");
var mergeWordTrees = require("./mergeWordTrees.js")
var pruneTree = require("./pruneTree.js")
var mergeDocTrees = require("./mergeDocTrees.js")
var pickSynsets = require("./pickSynsets.js")

analyzeCorpus(args).then(function(corpus){
  var docTrees = corpus.map(function(d){
    var wordTrees = d.map(function(w){
      return constructSynsetData(w)
    });
    return mergeWordTrees(wordTrees);
  });
  docTrees = docTrees.map(function(d){
    return pickSynsets(d);
  });
  docTrees = docTrees.map(function(d){
    return pruneTree(d, 1);
  });
  console.log(docTrees)
  corpusTree = mergeDocTrees(docTrees);
})

