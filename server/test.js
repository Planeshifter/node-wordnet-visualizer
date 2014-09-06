var traceur = require("traceur");
var args = process.argv.slice(2);

var analyzeCorpus = traceur.require("sentenceHypernymTree4.js");

analyzeCorpus(args).then(function(x){
	console.log(x.synsets)
})

