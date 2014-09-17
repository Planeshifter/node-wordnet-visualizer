module.exports = function mergeDocTrees(docArr){
  var masterTree = docArr.shift();
    console.log(masterTree)
  docArr.forEach(function(d){
    for (var key in d){
      var currentSynset = masterTree[key];
      if (currentSynset){
       	currentSynset.count++;
      	currentSynset.words ? currentSynset.words = currentSynset.words.concat(d[key].words) : currentSynset.words = d[key].words;
      } else {
        masterTree[key] = d[key];
      }
    }     
  });
 return masterTree;
}
