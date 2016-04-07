//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["VEP Total Ballots Counted", "VEP Highest Office", "VAP Highest Office", "% Non-citizen", "% in labor force"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

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

 	//create Albers equal area conic projection centered on France
 	var projection = d3.geo.albersUsa()
 	// 	.center([37, -119])
   // 	.rotate([-2, 0])
 	// 	.parallels([290, 450])
 	  .scale(1000)
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

      //joinData(unitedStates, csvData);

      //add coordinated visualization to the map
      setChart(csvData, colorScale);

    //variables for data join
    var attrArray = ["varA", "varB", "varC", "varD", "varE"];
      };
      };



      //function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
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
            var csvKey = csvRegion.state; //the CSV primary key

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
                    // //assign all attributes and values
                    // attrArray.forEach(function(attr){
                    //   if(attr == "State"){
                    //     var val = unitedStates[attr];
                    //
                    //   }
                    //   else{
                    //     var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    //   }
                    //     geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    // });
                };
                //console.log(unitedStates);
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
           return "regions " + d.properties.state;
       })
       .attr("d", path)
       .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        });
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
    // //chart frame dimensions
    // var chartWidth = window.innerWidth * 0.425,
    //     chartHeight = 473,
    //     leftPadding = 25,
    //     rightPadding = 2,
    //     topBottomPadding = 5,
    //     chartInnerWidth = chartWidth - leftPadding - rightPadding,
    //     chartInnerHeight = chartHeight - topBottomPadding * 2,
    //     translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

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




    //create a scale to size bars proportionally to frame and for axis
    // var yScale = d3.scale.linear()
    //     .range([463, 0])
    //     .domain([0, 100]);

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
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

    //     //annotate bars with attribute value text
    //  var numbers = chart.selectAll(".numbers")
    //      .data(csvData)
    //      .enter()
    //      .append("text")
    //      .sort(function(a, b){
    //          return a[expressed]-b[expressed]
    //      })
    //      .attr("class", function(d){
    //          return "numbers " + d.State;
    //      })
    //      .attr("text-anchor", "middle")
    //      .attr("x", function(d, i){
    //          var fraction = chartWidth / csvData.length;
    //          return i * fraction + (fraction - 1) / 2;
    //      })
    //      .attr("y", function(d){
    //          return chartHeight - yScale(parseFloat(d[expressed])) + 170;
    //      })
    //      .text(function(d){
    //          return d[expressed];
    //      });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");

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
    function createDropdown(){
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
              .style("fill", function(d){
                  return choropleth(d.properties, colorScale)
              });

          //re-sort, resize, and recolor bars
          var bars = d3.selectAll(".bar")
              //re-sort bars
              .sort(function(a, b){
                  return b[expressed] - a[expressed];
              })
              .attr("x", function(d, i){
                  return i * (chartInnerWidth / csvData.length) + leftPadding;
              })
              //resize bars
              .attr("height", function(d, i){
                  return 463 - yScale(parseFloat(d[expressed]));
              })
              .attr("y", function(d, i){
                  return yScale(parseFloat(d[expressed])) + topBottomPadding;
              })
              //recolor bars
              .style("fill", function(d){
                  return choropleth(d, colorScale);
              });
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
     .text("Number of Variable " + expressed[3] + " in each region");

    };

    // ON USER SELECTION:
    // 1. Change the expressed attribute
    // 2. Recreate the color scale with new class breaks
    // 3. Recolor each enumeration unit on the map
    // 4. Re-sort each bar on the bar chart
    // 5. Resize each bar on the bar chart
    // 6. Recolor each bar on the bar chart




})();
