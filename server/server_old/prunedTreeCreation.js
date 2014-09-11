var tm = require("text-miner");
var wn = require("wordnet-magic");
var Promise = require("bluebird");
var _ = require("underscore");
var util = require("util");
var ndarray = require("ndarray");
var ops = require("ndarray-ops");
var unpack = require("ndarray-unpack")
var arraySugar = require("./array.js")

var idStore = [];

module.exports = getHypernymTree = function(arr){

     	var wordSynsetsPromise = arr.map(function(s){
	        s.hypernym = s.getHypernymTree();
	        return Promise.props(s);	
	    });
	    var wordSynsetsPromiseAll = Promise.all(wordSynsetsPromise);

    var dataPromise = wordSynsetsPromiseAll.then(function(wordSynsets){
   
      	var adjMatrix = ndarray(Int8Array(100 * 100), [100, 100]);
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
			  adjMatrix.set(parentIndex, childIndex, 1);  	
			  
	    	var selectedSynset = synsets.filter(elem => elem.synsetid == obj.synsetid);
		    if (selectedSynset.length === 0){
			  synsets.push(obj); 
		    } 
		    if (obj.hypernym.length !== 0) processObject(obj.hypernym[0]);
		    return;  
  		}
  		wordSynsets.forEach(elem => processObject(elem));

  		synsets = synsets.map(elem => {
  			// delete elem.hypernym;
  			elem.counter = 1;
  			return elem;
  		}); 

  		var data = {};
      	data.synsets = synsets;
      	data.adjMatrix = adjMatrix;
      	return Promise.props(data);
      })

      return Promise.all(dataWordPromises);
    });

	var sentenceTreePromise = dataPromise.then(arr => mergeWordTrees(arr));
  
  var prunedTree = Promise.join(wordSynsetsPromiseAll, sentenceTreePromise, function(wordSynsets, arr){
    return pruneDocumentTree(arr, wordSynsets);  
  })
  return prunedTree;
}

function synsetUnion(syn1, syn2){
  var synsetCounts = [];
  var syn1Ids = syn1.map(elem => elem.synsetid);
  syn2.forEach(function(elem){
    if (_.contains(syn1Ids, elem.synsetid)){
      syn1.filter(synset1 => synset1.synsetid === elem.synsetid).map(foundSynset => {
      	foundSynset.counter++;
      	return foundSynset;
      })	
    } else {
      syn1.push(elem);
    }
  })
  return syn1;
}

function mergeWordTrees(arr){
  var res = arr.reduce(function(a, b){
    a.synsets = synsetUnion(a.synsets, b.synsets);
    ops.add(a.adjMatrix, b.adjMatrix, a.adjMatrix);
    return a;
  })
  res.adjMatrix.idStore = idStore;
  return res;
}

function pruneDocumentTree(arr, wordSynsetsArray){
  var synsets = arr.synsets;
  console.log("length:" + synsets.length)
  var adjMatrix = arr.adjMatrix;
  
  var toKeepSynsets = wordSynsetsArray.map(function(wArr){
    var weights = [];

    wArr.forEach(s => {
      var parents = [];
      function traverseTree(child){
        child.hypernym.forEach(function(hypernym){
          parents.push(hypernym.synsetid)
          traverseTree(hypernym);
        }, child);
      } 
      traverseTree(s)
      var wordCountArray = parents.map(id => {
        var ret = synsets.filter(s => s.synsetid === id).map(e => e.counter);
        return ret[0] || 0;
      })
      // weight according to tree depth (penalize ancestors farther away from leafs)
      var adjustedWordCountArray = wordCountArray.map( (e, i) => { return e / (i+1)});
      var wordCount = 0;
      if (adjustedWordCountArray.length > 0 ){
        wordCount = adjustedWordCountArray.reduce((a, b) => { return a + b });
      }
      weights.push(wordCount);
    })
    var maxSynsetId = weights.indexOf(Math.max.apply(Math, weights));
    return wArr.filter( (e,i) => i == maxSynsetId);
  });

  toKeepSynsets = _.flatten(toKeepSynsets);
 
  console.log(arr.synsets.length)
  return arr;
}

function mergeDocumentTrees(arr){
  var res = arr.reduce(function(a, b){
    a.synsets = synsetUnion(a.synsets, b.synsets);
    ops.add(a.adjMatrix, b.adjMatrix, a.adjMatrix);
    return a;      
  });
  res.adjMatrix.idStore = idStore;
  return res;
}