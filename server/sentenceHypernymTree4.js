var tm = require("text-miner");
var wn = require("wordnet-magic")();
var Promise = require("bluebird");
var _ = require("underscore");
var util = require("util");
var memoize = require("./memoize.js");
var ndarray = require("ndarray");
var ops = require("ndarray-ops");
var ndbits = require("ndarray-bit");

module.exports = function analyzeCorpus(docs){

  var idStore = [];

  var getWordSynsets = memoize(function(word){
  	var ret = word.getSynsets().map(s => {
  	  s.hypernym = s.getHypernymTree();
  	  return Promise.props(s);		
  	});
  	return Promise.all(ret);
  });

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


  /*
  @wordArray: array of words of a single document
  */ 
  function processWordArray(wordArray){
    var wordArrayPromise = wordArray.map(x => wn.morphy(x));
    var synsetsPromise = Promise.all(wordArrayPromise)
    						.then(elem => elem.filter(elem => elem.length >= 1))
    						.then(elem => elem.map(arr => new wn.Word(arr[0].lemma,"n")))
  						.then(arr => arr.map(w => getWordSynsets(w)));		
    return synsetsPromise;
  }

  function getCorpusSynsets(docs){
    console.log(docs)
    console.log(global)
  	// empty stored IDs
  	idStore = [];

  	if (Array.isArray(docs) === false){
  		docs = Array(docs);
  	}
  	var corpus = new tm.Corpus(docs);
  	corpus = corpus
  			.removeInterpunctuation()
  			.removeNewlines()
  			.toLower()
  			.removeWords(tm.STOPWORDS.EN)
  			.clean();
  	var wordArrays = corpus.documents.map(x => x.split(" "));
  	// word arrays (array of length d)
  	wordArrays = wordArrays.map(arr => _.uniq(arr));
  	// synsetsTrees : length d, each one is array with synset arrays
  	var synsetsTrees = wordArrays.map(arr => processWordArray(arr));
    synsetsTrees[0].then(console.log)
  	synsetsTrees = synsetsTrees.map(elem => elem.filter(elem => elem.length >= 1));

  	var docData = synsetsTrees.map(doc => constructWordData(doc));
      var mergedDocData = Promise.all(docData.map(docArr => docArr.then(x => mergeWordTrees(x))));

  	var prunedTree = mergedDocData.map( (doc, i) => {
  		return Promise.join(synsetsTrees[i], doc, function(wordSynsets, arr){
      		return pruneDocumentTree(arr, wordSynsets);  
    		});
  	});

  	var mergedCorpusTree = prunedTree.then(docArrs => mergeDocumentTrees(docArrs));
  	return mergedCorpusTree;
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

  function mergeDocumentTrees(arr){
    var res = arr.reduce(function(a, b){
      a.synsets = synsetUnion(a.synsets, b.synsets);
      ops.add(a.adjMatrix, b.adjMatrix, a.adjMatrix);
      return a;      
    });
    res.adjMatrix.idStore = idStore;
    return res;
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


  function pruneDocumentTree(arr, wordSynsetsArray){
    var synsets = arr.synsets;
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

    return createPrunedTree(toKeepSynsets); 
   
  }

  function createPrunedTree(toKeepSynsets){

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
        }  

          var selectedSynset = synsets.filter(elem => elem.synsetid == obj.synsetid);
          if (selectedSynset.length === 0){
            synsets.push(obj); 
          } 
          if (obj.hypernym.length !== 0) processObject(obj.hypernym[0]);
          return;  
        }
        toKeepSynsets.forEach(elem => processObject(elem));

        var data = {};
        data.synsets = synsets;
        data.adjMatrix = adjMatrix;

        return data;
  }

  // start analysis and return result
  return getCorpusSynsets(docs);
}