//var distribution = gaussian(0, 1);
//var distribution = gaussian(0, 1);
//incBeta(x, a, b)
require('mathfn')

var margin = {
  top: 20,
  right: 20,
  bottom: 30,
  left: 50
},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#dogs").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csvParse(dogs_csv, function(data) {});

const regIncBeta = (p, n, x) =>
      incBeta(p, x, n+1-x) /
         Beta(   x, n+1-x)

function getData(mean, sigma) {
  const n = 100000;
  var data = [];
  for (var i = 0; i < n; i++) {
    q = ((i/n)-.5)*20;
    //p = distribution.pdf(q);
    p = regIncBeta(.5, 12, q);
    el = {
      "q": q,
      "p": p
    }
    data.push(el)
  };
  return data;
}

function drawGaussian(svg, mean, sigma) {
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  var xAxis = d3.axisBottom(xScale);
  var yAxis = d3.axisLeft(yScale);

  var count = 0;
  var line = d3.line()
      .x(d => xScale(d.q))
      .y(d => yScale(d.p));

  const data = getData(mean, sigma); // popuate data

  xScale.domain(d3.extent(data, d => d.q))
  yScale.domain(d3.extent(data, d => d.p))

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);
}

drawGaussian(svg, .1, 19)
