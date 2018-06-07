const epsilon = 1e-20

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


function drawGaussian(svg, n, p) {
  const data = binomPoints(n, p); // popuate data

  const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .range([0, width]);
  const yScale = d3.scaleLinear()
        //.domain(d3.extent(data, d => d.y))
        .domain([0, 10])
        .range([height, 0]);

  var xAxis = d3.axisBottom(xScale);
  var yAxis = d3.axisLeft(yScale);

  const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

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

// http://ac.inf.elte.hu/Vol_039_2013/137_39.pdf
const ilienko = (x, n, p) => {
  if (x <= epsilon) return 0;
  if (x >= n+1) return 0;

  return this.jStat.ibeta(p, x, n+1) /
         this.jStat.betafn(  x, n+1-x)
}

const continuousBinom = (x_in, n, p_in) => {
  const isUpper = p_in > 0.5

  var p = isUpper ? 1-p_in : p_in // The function is only well-behaved for p < .5
  //p = 2*p // no idea why i have to do this? - this is only necessary in zipfR??
  p = Math.min(p, 1-epsilon) // Make sure p isn't exactly 1

  const x = isUpper ? (n+1) - x_in : x_in;

  const res = ilienko(x, n, p)

  return res
}


function binomPoints(n, p) {
  const points = 1000;

  const expand = 1.01

  var sum = 0;
  const data = _.range(0, n+expand, (n+expand)/points)
        .map(x => {
          const cb = continuousBinom(x, n, p)
          sum += cb
          return {"x": x, "y": cb}
        })
        .map(o => _.update(o, ['y'], y => y / (sum / points)))

  return data;
}

//drawGaussian(svg, 20, .8)
drawGaussian(svg, 2, .8)

