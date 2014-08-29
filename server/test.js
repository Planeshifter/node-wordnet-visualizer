var traceur = require("traceur");
var sena = traceur.require("sentenceHypernymTree3.js");

sena.analyzeCorpus(["soldier"]).then(function(x){
	console.log(x.synsets)
})

