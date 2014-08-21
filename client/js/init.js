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
                    .attr("id", "graph")
                    .call( // <-A
						d3.behavior.zoom() // <-B
						.scaleExtent([1, 10]) // <-C
						.on("zoom", zoom) // <-D
					);
                    						
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
				});
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

        nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .style("fill", function (d) {
                    return d._children ? "lightsteelblue" : "#fff";
                })
                .attr("title",function(d){
                	var str = "Definition: " + d.definition + "<br\>";
                	str += "POS: " + d.pos;
                	str += "<br\>";
                	str += "Lexical Domain: " + d.lexdomain;
                	return str;
                });

        var nodeUpdate = node.transition()
                .attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

        nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", function (d) {
                    return d._children ? "lightsteelblue" : "#fff";
                });

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
                    var words =  d.words.map(function(e){ return e.lemma; });
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

function paintSentenceGraph() {
	
	query = encodeURIComponent($("#input_text").val());
	url = "http://127.0.0.1:12000/analyze_sentence?" + query;
	
	if(query !== ""){
		$.ajax({
			type : "GET",
			url : url
		}).done(function(msg) {
			if (msg.length > 1) {
		      var root = {};
		      root.words = [{lemma: "root"}];
		      root.lexdomain = "NA";
		      root.definition = "NA";
		      root.pos = "NA";
		      root.children = msg;
		      chart.nodes(root).render();
			} else {
			  chart.nodes(msg[0]).render();	
			}
		});
	}

}

function clearSentence(){
	$("#input_text").val("");
	d3.select("#graph").remove();
	chart = tree();
}

$(function() {
  $( document ).tooltip({
    content: function() {
        return $(this).attr('title');
    }
  });
});