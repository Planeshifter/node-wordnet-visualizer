function tree() {
    var _chart = {};

    var _width = 1600, _height = 800,
            _margins = {top: 30, left: 120, right: 30, bottom: 30},
            _svg,
            _nodes,
            _i = 0,
            _tree,
            _diagonal,
            _bodyG;
 
   function zoom() {
	 _svg.attr("transform", "translate("
     + d3.event.translate
     + ")scale(" + d3.event.scale + ")");
   }

    _chart.render = function () {
    	tree.iterator += 1;
        if (!_svg) {
            _svg = d3.select("body").append("svg")
                    .attr("height", _height)
                    .attr("width", _width)
                    .attr("id", "graph");
                    						
        }

        renderBody(_svg);
    };

    function renderBody(svg) {
        if (!_bodyG) {
            _bodyG = svg.append("g")
				.attr("class", "body")
				.attr("transform", function (d) {
					return "translate(" + _margins.left 
						+ "," + _margins.top + ")";
				}).call( // <-A
                        d3.behavior.zoom() // <-B
                        .scaleExtent([1, 8]) // <-C
                        .on("zoom", zoom) // <-D
                );
        }

        _tree = d3.layout.tree()
                .size([
					(_height - _margins.top - _margins.bottom), 
					(_width - _margins.left - _margins.right)
				]);

        _diagonal = d3.svg.diagonal()
                .projection(function (d) {
                    return [d.y, d.x];
                });

        _nodes.x0 = (_height - _margins.top - _margins.bottom) / 2;
        _nodes.y0 = 0;

        render(_nodes);
    }

    function render(source) {
        var nodes = _tree.nodes(_nodes).reverse();

        renderNodes(nodes, source);

        renderLinks(nodes, source);
    }

    function renderNodes(nodes, source) {
        nodes.forEach(function (d) {
            d.y = d.depth * 90;
        });

        var node = _bodyG.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id || (d.id = ++_i);
                });

        var nodeEnter = node.enter().append("svg:g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + source.y0 
						+ "," + source.x0 + ")";
                })
                .on("click", function (d) {
                    toggle(d);
                    render(d);
                });

    var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

        nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .attr("class","synsetNode")
                .style("fill", "steelblue")
                .attr("title",function(d){
                	var str = "Definition: " + d.data.definition + "<br\>";
                	str += "POS: " + d.data.pos;
                	str += "<br\>";
                	str += "Lexical Domain: " + d.data.lexdomain;
                  str += "<br\>";
                  str += "Counter: " + d.count;
                  str += "Corpus words: " + d.words;
                	return str; })
                .on("mouseover", function(d) {
                  var str = "";
                  if (d.words){
                    str += "<strong>Words:</strong> " + d.words.join(", ");
                    str += "<br\>"
                    str += "<strong>Definition:</strong> " + d.data.definition + "<br\>";
                    str += "<strong>POS</strong>: " + d.data.pos;
                    str += "<br\>";
                    str += "<strong>Lexical Domain:</strong> " + d.data.lexdomain;
                    str += "<br\>";
                    str += "<strong>Count:</strong> " + d.count;
                  }
                  else {
                    str += "<strong>Definition:</strong> " + d.data.definition + "<br\>";
                    str += "<strong>POS</strong>: " + d.data.pos;
                    str += "<br\>";
                    str += "<strong>Lexical Domain:</strong> " + d.data.lexdomain;
                    str += "<br\>";
                    str += "<strong>Count:</strong> " + d.count;
                  }
                    div.transition()        
                       .duration(200)      
                       .style("opacity", .9);      
                    div.html(str)  
                       .style("left", (d3.event.pageX) + "px")     
                       .style("top", (d3.event.pageY - 100) + "px");    
                  })                  
                .on("mouseout", function(d) {       
                    div.transition()        
                        .duration(500)      
                        .style("opacity", 0);   
                });



        var nodeUpdate = node.transition()
                .attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

        nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", "steelblue");

        var nodeExit = node.exit().transition()
                .attr("transform", function (d) {
                    return "translate(" + source.y 
						+ "," + source.x + ")";
                })
                .remove();

        nodeExit.select("circle")
                .attr("r", 1e-6);

        renderLabels(nodeEnter, nodeUpdate, nodeExit);

        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function renderLabels(nodeEnter, nodeUpdate, nodeExit) {
        nodeEnter.append("svg:text")
                .attr("x", function (d) {
                    return d.children || d._children ? -10 : 10;
                })
                .attr("dy", ".35em")
                .attr("text-anchor", function (d) {
                    return d.children || d._children ? "end" : "start";
                })
                .text(function (d) {
                	console.log(d.words)
                    var words =  d.data.words.slice(0, 3).map(function(e){ return e.lemma; });
                    return words.join(", ");
                })
                .style("fill-opacity", 1e-6);

        nodeUpdate.select("text")
                .style("fill-opacity", 1);

        nodeExit.select("text")
                .style("fill-opacity", 1e-6);
    }

    function renderLinks(nodes, source) {
        var link = _bodyG.selectAll("path.link")
                .data(_tree.links(nodes), function (d) {
                  console.log(d.target.id)
                    return d.target.id;
                });

        link.enter().insert("svg:path", "g")
                .attr("class", "link")
                .attr("d", function (d) {
                    var o = {x: source.x0, y: source.y0};
                    return _diagonal({source: o, target: o});
                });

        link.transition()
                .attr("d", _diagonal);

        link.exit().transition()
                .attr("d", function (d) {
                    var o = {x: source.x, y: source.y};
                    return _diagonal({source: o, target: o});
                })
                .remove();

        $("#spinnerContainer").hide();
    }

    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }

    function toggleAll(d) {
        if (d.children) {
            d.children.forEach(toggleAll);
            toggle(d);
        }
    }

    _chart.width = function (w) {
        if (!arguments.length) return _width;
        _width = w;
        return _chart;
    };

    _chart.height = function (h) {
        if (!arguments.length) return _height;
        _height = h;
        return _chart;
    };

    _chart.margins = function (m) {
        if (!arguments.length) return _margins;
        _margins = m;
        return _chart;
    };

    _chart.nodes = function (n) {
        if (!arguments.length) return _nodes;  
        _nodes = n;
        return _chart;
    };
    
    return _chart;
}

var chart = tree();

paintSentenceGraph.last_query = "";

function paintSentenceGraph(type) {
  var $docs = $("#document_holder textarea");
  var corpus = [];
  $docs.each(function(index, elem){
    corpus.push(elem.value);
  });

  var treshold = $("#pruning_treshold").val();
  var postData = {"corpus": corpus,
                  "treshold": treshold};
  var postDataJSON = JSON.stringify(postData);
	query = encodeURIComponent($("#input_text").val());

    if(query !== ""){
      if(postDataJSON !== paintSentenceGraph.last_query){
      url = "http://philipp-burckhardt.com:12000/analyze_corpus";

        $.ajax({
            type : "POST",
            url : url,
            data: postDataJSON
        }).done(function(msg) {
            var root = msg;
            root.data = {};
            root.count = "NA";
            root.parentId = "NA";
            root.words = "NA";
            root.data.words = [{lemma: "root"}];
            root.data.lexdomain = "NA";
            root.data.definition = "NA";
            root.data.pos = "NA";
            root.data.children = msg;
            console.log(root)
            paintSentenceGraph.data = root;
  
            switch(type){
              case "text":              
                renderText(paintSentenceGraph.data);
              break; 
              case "graph":   
                chart.nodes(root).render();
              break;
            }

            paintSentenceGraph.last_query  = corpusJSON;
        });
      } else {
           switch(type){
              case "text":              
              console.log(paintSentenceGraph.data)
                renderText(paintSentenceGraph.data);
              break; 
              case "graph":   
                chart.nodes(paintSentenceGraph.data).render();
              break;
            }

      }
    }

}

function clearSentence(){
	d3.select("#graph").remove();
  d3.select("#dendogram").remove();
	chart = tree();
}

function renderText(input){

var countLeafElements = (function (){
  var counter = 0;
  return function(obj){ 
    if (obj.children && obj.children.length > 0){
      obj.children.forEach(countLeafElements);
    } else {
      counter += 1;
    }
    return counter;  
  }
}());

var numberOfLeafs = countLeafElements(input);

var width = window.innerWidth,
    height = numberOfLeafs *  15;

var cluster = d3.layout.cluster()
    .size([height, width - 160]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id","dendogram")
    .append("g")
    .attr("transform", "translate(40,0)");

  var nodes = cluster.nodes(input),
      links = cluster.links(nodes);

  console.log(_nodes)
  
  var link = svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("id",function(d){ return d.synsetid })
      .attr("class", "link")
      .attr("d", diagonal);

  var node = svg.selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

  node.append("text")
      .attr("dx", function(d) { return d.children ? -8 : 8; })
      .attr("dy", 3)
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .style("-webkit-transform","rotate(0deg)")
      .text(function(d) { return d.words[0].lemma; });

  return svg;
}

var docCount = 1;
$(function() {
  $body = $("body");
  $body.append("<div id='spinnerContainer'></div>");
  $spinnerContainer = $("#spinnerContainer");
  $spinnerContainer.append("<div id='spinner'></div>")
  $("#spinner").append("<div id='loader'></div>");


  $document_holder = $("#document_holder");
  $document_holder.append("<h3>Document " + docCount + " </h3>")
  $document_holder.append("<textarea rows=4> </textarea>");

  $addDocumentBtn = $("#add_document_button");
  $addDocumentBtn.on("click", function(){
  	docCount += 1;
  	$document_holder.append("<h3>Document " + docCount + " </h3>")
  	$document_holder.append("<textarea rows=4> </textarea>");
  })

  $("#analyze_button").on("click", function(){
    $spinnerContainer.fadeIn();
    $("body").css({"overflow-y":"scroll"});
    $(".row").hide();
    $("#back_button").show();

    d3.select("#graph").remove();
    chart = tree();
    paintSentenceGraph("graph");  
  });

  $("#back_button").on("click",function(){
    clearSentence();
    $(this).hide();
    $(".row").fadeIn("normal");
  })

});