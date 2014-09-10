var traceur = require("traceur");
var util = require("util");
var args = process.argv.slice(2);

var analyzeCorpus = require("./synsetRepresentation.js");
var constructSynsetData = require("./semanticTree.js");

analyzeCorpus(args).then(function(corpus){
  corpus.forEach(function(d){
    d.forEach(function(w){
      constructSynsetData(w)
    })
  })
})

