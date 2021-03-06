//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["VEP Highest Office","VAP Highest Office","% Non-citizen","% in labor force","Percent below poverty level"]; //list of attributes
var expressed = attrArray[0]; //initial attribute



// // Create global title for each variable
// var title_VEP = "VEP highest office ";
// var title_VAP = "VAP highest office";
// var title_noncitizens = "percentage of noncitizens";
// var title_laborforce = "percent in labor force";
// var title_povertyline = "percent below the poverty line"
//
// //Create the description container
// var descriptionDiv;
//
// // Create global descriptions for each variable
// var desc_VEP = "The VEP highest office is the percentage of the voting-eligible population that voted for highest office.  VEP excludes people who are ineligible to vote.  People who are ineligible to vote are non-citizens, felons and mentally incapacitated persons. The data also does not include people who are in the military or people who live overseas.<sup>[2]</sup>"
// var desc_VAP = "The VAP highest office is the percentage of the voting-age population that voted. The voting-age population consists of people who are 18 years or older according to the Bureau of the Census.<sup>[1]</sup>";
// var desc_noncitizens = "The percentage of noncitizens is the percentage of people in each state who are not citizens.<sup>[2]</sup>";
// var desc_laborforce = "The percent in labor force refers to the percentage of people who work in each state.<sup>[2]</sup>";
// var desc_povertyline = "The percent below the poverty line represents the population below the poverty line in each state in 2008.<sup>[2]</sup>"




//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scale.linear()
    .range([463, 0])
    .domain([0, 110]);

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
  //map frame dimensions
  var width = window.innerWidth * 0.5,
      height = 460;

 	//create new svg container for the map
 	var map = d3.select("body")
 		.append("svg")
 		.attr("class", "map")
 		.attr("width", width)
 		.attr("height", height);

    var pageTitle = d3.select("body")
		.append("text")
		.attr("class", "pageTitle")
		.html("Voting in the United States:<br> By State in 2008");
 	//create Albers equal area conic projection centered on France
 	var projection = d3.geo.albersUsa()
 	  .scale(800)
 		.translate([width / 2, height / 2]);

 	var path = d3.geo.path()
 		.projection(projection);

 //use queue.js to parallelize asynchronous data loading
 	d3_queue.queue()
        .defer(d3.csv, "data/voting.csv") //load attributes from csv
        .defer(d3.json, "data/usStates.topojson") //load background spatial data
        .await(callback);

  function callback(error, csvData, us){

    //place graticule on the map
    setGraticule(map, path);

    //translate europe TopoJSON
    var unitedStates = topojson.feature(us, us.objects.usStates).features;

      //join csv data to GeoJSON enumeration units
      unitedStates = joinData(unitedStates, csvData);

      var colorScale = makeColorScale(csvData);

      //add enumeration units to the map
      setEnumerationUnits(unitedStates, map, path, colorScale);


      //add coordinated visualization to the map
      setChart(csvData, colorScale);
      createDropdown(csvData);

    //variables for data join
    //var attrArray = ["varA", "varB", "varC", "varD", "varE"];
      };
      };



      //function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#f5ccff",
        "#e580ff",
        "#d633ff",
        "#b800e6",
        "#7a0099"
    ];

    //create color scale generator
    var colorScale = d3.scale.quantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

function setGraticule(map, path){
      //create graticule generator
      var graticule = d3.geo.graticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

      //create graticule background
      var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

      //create graticule lines
      var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
      };

      function joinData(unitedStates, csvData){
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){

            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.name; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<unitedStates.length; a++){

                var geojsonProps = unitedStates[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.name; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){
                  //assign all attributes and values
                        attrArray.forEach(function(attr){
                            var val = parseFloat(csvRegion[attr]); //get csv attribute value
                            geojsonProps[attr] = val; //assign attribute and value to geojson properties
                        });
                };
            };
        };
        return unitedStates;

    };
    function setEnumerationUnits(unitedStates, map, path, colorScale){
      //add US States to map
      var regions = map.selectAll(".regions")
       .data(unitedStates)
       .enter()
       .append("path")
       .attr("class", function(d){
           return "regions " + d.properties.name;
       })
       .attr("d", path)
       .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
                highlight(d.properties);
        })
        .on("mouseout", function(d){
              dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
        var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
        };

    //function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (val && val != NaN){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};



            //function to create coordinated bar chart
function setChart(csvData, colorScale){
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    //set bars for each province
    var bars = chart.selectAll(".bar")
    .data(csvData)
     .enter()
     .append("rect")
     .sort(function(a, b){
         return b[expressed]-a[expressed]
        })
      .attr("class", function(d){
            return "bar " + d.name;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}')


    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle");

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale);
    };




      //function to create a dropdown menu for attribute selection
      function createDropdown(csvData){
          //add select element
          var dropdown = d3.select("body")
         .append("select")
         .attr("class", "dropdown")
         .on("change", function(){
             changeAttribute(this.value, csvData)
         });

          //add initial option
          var titleOption = dropdown.append("option")
              .attr("class", "titleOption")
              .attr("disabled", "true")
              .text("Select Attribute");

          //add attribute name options
          var attrOptions = dropdown.selectAll("attrOptions")
              .data(attrArray)
              .enter()
              .append("option")
              .attr("value", function(d){ return d })
              .text(function(d){ return d });
  };
  //dropdown change listener handler
function changeAttribute(attribute, csvData){
//change the expressed attribute
expressed = attribute;

//recreate the color scale
var colorScale = makeColorScale(csvData);

//recolor enumeration units
var regions = d3.selectAll(".regions")
    .transition()
    .duration(1000)
    .style("fill", function(d){
        return choropleth(d.properties, colorScale)
    });

//re-sort, resize, and recolor bars
var bars = d3.selectAll(".bar")
//re-sort bars
    .sort(function(a, b){
    return b[expressed] - a[expressed];
  })
    .transition() //add animation
    .delay(function(d, i){
        return i * 20
    })
    .duration(500);

updateChart(bars, csvData.length, colorScale);

};

      //function to position, size, and color bars in chart
      function updateChart(bars, n, colorScale){
          //position bars
          bars.attr("x", function(d, i){
                  return i * (chartInnerWidth / n) + leftPadding;
              })
              //size/resize bars
              .attr("height", function(d, i){
                  return 463 - yScale(parseFloat(d[expressed]));
              })
              .attr("y", function(d, i){
                  return yScale(parseFloat(d[expressed])) + topBottomPadding;
              })
              //color/recolor bars
              .style("fill", function(d){
                  return choropleth(d, colorScale);
              });
              //at the bottom of updateChart()...add text to chart title
              var chartTitle = d3.select(".chartTitle")
                .text("Percentage of Variable " + expressed + " in Each State");
              };

    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.name)
            .style({
                "stroke": "darkgrey",
                "stroke-width": "3"
            });
            setLabel(props);
    };

    //function to create dynamic label
function setLabel(props){
	//label content
	var labelAttribute = "<h1>" + props[expressed] +
		"</h1><b>" + expressed + "</b>";

	//create info label div
	var infolabel = d3.select("body")
		.append("div")
		.attr({
			"class": "infolabel",
			"id": props.name + "_label"
		})
		.html(labelAttribute);

	var regionName = infolabel.append("div")
		.attr("class", "labelname")
		.html(props.name);
};


    //function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.name)
        .style({
            "stroke": function(){
                return getStyle(this, "stroke")
            },
            "stroke-width": function(){
                return getStyle(this, "stroke-width")
            }
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove();
};



//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style({
            "left": x + "px",
            "top": y + "px"
        });
};

})();
