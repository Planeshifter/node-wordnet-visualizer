var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var _ = require("underscore");
var util = require("util");
/*
@sentence: sentence to be processed
*/
module.exports = function sentenceAnalyzer(sentence){

	var corpus = new tm.Corpus(Array(sentence));
	corpus = corpus
			.removeInterpunctuation()
			.removeNewlines()
			.toLower()
			.removeWords(tm.STOPWORDS.EN)
			.clean();

	var wordArray = corpus.documents[0].split(" ");
	var wordArrayPromise = wordArray.map(x => wn.morphy(x));
	var wordArrayDone = Promise.all(wordArrayPromise);
	var wordArrayPromise2 = wordArrayDone.then(elem => elem.filter(elem => elem.length >= 1)).then(elem => elem.map(arr => new wn.Word(arr[0].lemma,"n")));
    var synsetArrayPromise = wordArrayPromise2.then(arr => arr.map(w => w.getSynsets()));		
    var synsetArrayPromise2 = Promise.all(synsetArrayPromise);
    var synsetArrayPromise3 = synsetArrayPromise2.map(function(wordFields, index){
      return wordFields.map(function(elem){
        elem.wordIndex = index;
        return elem;
      });	
    })
    var flattenedArray = synsetArrayPromise3.then(arr => arr.reduce(function(a,b){ return a.concat(b); }));
    var processedSynsetArray = flattenedArray.then(arr => {
        var extendedArrPromise = arr.map(function(s){
	      s.hypernym = s.getHypernymTree();
	      return Promise.props(s);	
	    });
	    return Promise.all(extendedArrPromise)
    });
    
    var dataPromise = processedSynsetArray.then(function(arr){
      var adjMatrix = [];
      var synsets = [];	
		
	  function processObject(obj){	

	    if (obj.hypernym.length !== 0){
		  if (!adjMatrix[obj.hypernym[0].synsetid]){
		    adjMatrix[obj.hypernym[0].synsetid] = [];
		  }
		  adjMatrix[obj.hypernym[0].synsetid][obj.synsetid] = 1;  	
		}  	
		var selectedSynset = synsets.filter(elem => elem.synsetid == obj.synsetid);
	    if (selectedSynset.length === 0){
	      //console.log("First encounter")
	      obj.counter = 1;
		  synsets.push(obj); 
	    } else {
	      	//console.log("zaehle hoch " + obj.words.map(word => word.lemma).join(","));
	        selectedSynset[0].counter++;
	    } 
	    if (obj.hypernym.length !== 0) processObject(obj.hypernym[0]);
	    return;
	  }
      arr.forEach(elem => processObject(elem));
      var data = {};
      data.synsets = synsets;
      data.adjMatrix = adjMatrix;
      return Promise.props(data);
    });
	return dataPromise;
}
