var _ = require("underscore");
var arr = require("./array.js");

module.exports = function pickSynsets(tree){
	var baseSynsets = _.filter(tree, function(elem){
		return "ancestors" in elem.data;
	});

	var groupedSynsets =  _.groupBy(baseSynsets, "words");
	var allAncestors = baseSynsets.map(function(e){ return e.data.ancestors; });
	allAncestors = _.flatten(allAncestors);
	var ancestorCounts = _.countBy(allAncestors);

	for (var key in groupedSynsets){
		var wordArray = groupedSynsets[key];
		var scores = wordArray.map(function(w){
			var score = 0;
			w.data.ancestors.forEach(function(id){
				score += tree[id].count;
			});
			score = score / w.data.ancestors.length || w.count;
			w.score = score;
			return score;
		});

		var maxScore = scores.max();
		wordArray.forEach(function(w){
      	  if (w.score !== maxScore) {
      	   var ancestors = w.data.ancestors;
      	   delete tree[w.data.synsetid];
      	   ancestors.forEach(function(id){
      	     ancestorCounts[id]--;
      	     if (ancestorCounts[id] === 0) delete tree[id];
      	   });
      	  }
		});
	}
	return tree;
};
