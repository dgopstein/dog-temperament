console.log("ibetainv: ", this.jStat.ibetainv(1, 2, 2))

//console.log("ibetainv: ", this.jStat.ibetainv(.1, 1, 2))
//console.log("betacf: ", this.jStat.betacf(.1, 1, 2))
//console.log("betaln: ", this.jStat.betaln(.1, 1, 2))
//console.log("ibeta: ", this.jStat.ibeta(.1, 1, 2))
//console.log("betafn: ", this.jStat.betafn(  1, 2))


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

// http://ac.inf.elte.hu/Vol_039_2013/137_39.pdf
const ilienko = (x, n, p) => {
  if (x <= 0) return 0;
  if (x > n+1) return 1;

  return this.jStat.ibeta(p, x, n+1) /
         this.jStat.betafn(  x, n+1-x)
}

const continuousBinom = (x_in, n, p_in) => {
  isUpper = p_in > 0.5

  p = isUpper ? 1-p_in : p_in // The function is only well-behaved for p < .5
  p = 2*p // no idea why i have to do this?
  p = Math.min(p, 1-(1e-20)) // Make sure p isn't exactly 1

  x = isUpper ? n - x_in : x_in;

  return ilienko(x, n-1, p)
}


function binomPoints(n, p) {
  const points = 1000;

  const data = _.range(0, n, n/points)
        .map(x => {return {"q": x, "p": continuousBinom(x, n, p)}})

  return data;
}

function drawGaussian(svg, n, p) {
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  var xAxis = d3.axisBottom(xScale);
  var yAxis = d3.axisLeft(yScale);

  var count = 0;
  var line = d3.line()
      .x(d => xScale(d.q))
      .y(d => yScale(d.p));

  const data = binomPoints(n, p); // popuate data

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

drawGaussian(svg, 10, .1)
