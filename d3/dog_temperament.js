/////////////// continuous binomial //////////////////

// http://ac.inf.elte.hu/Vol_039_2013/137_39.pdf
// The paper claims this is continuous analog of the binomial distribution, but
// empirically it only resembles the binomial for p <= 0.5
const ilienko = (x, n, p) => {
  if (x <= 0) return 0;
  if (x >= n+1) return 0;

  return this.jStat.ibeta(p, x, n+1) /
         this.jStat.betafn(  x, n+1-x)
}

// Mirror the results of ilienko about p = 0.5 so that the function mimics
// the binomial distribution for all p in [0, 1]
const epsilon = 1e-20
const continuousBinom = (x_in, n, p_in) => {
  const isUpper = p_in > 0.5

  var p = isUpper ? 1-p_in : p_in // The function is only well-behaved for p < .5
  //p = 2*p // using zipfR::Ibeta(..., lower=FALSE) in R requires multiplying the result by two. jstat does not require this
  p = Math.min(p, 1-epsilon) // Make sure p isn't exactly 1

  const x = isUpper ? (n+1) - x_in : x_in;

  return ilienko(x, n, p)
}

// generate a continuous binomial distribution for all p in [0, 1]
function binomPoints(n, p) {
  const points = 1000;

  const maxN = n + 1.01

  const binoms = _.range(0, maxN, maxN/points)
        .map(x => {return {"x": x / maxN, "y": continuousBinom(x, n, p)}})
  const auc = _.sumBy(binoms, o => o.y) / points
  const scaledBinoms = binoms.map(o => _.update(o, ['y'], y => y / auc))

  return scaledBinoms;
}

/////////////// D3 Drawing //////////////////

var margin = {
  top: 2,
  right: 2,
  bottom: 0,
  left: 5
},
    width = 500 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

d3.csvParse(dogs_csv, function(data) {});


function drawBinom(svg, n, p) {
  const data = binomPoints(n, p); // popuate data

  const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .range([0, width]);
  const yScale = d3.scaleLinear()
        //.domain(d3.extent(data, d => d.y))
        .domain([0, 5])
        .range([height, 0]);

  var xAxis = d3.axisBottom(xScale).tickValues([]).tickSizeOuter(0);
  var yAxis = d3.axisLeft(yScale).tickValues([]).tickSizeOuter(0);

  const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

  parent = svg

  parent.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  parent.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  parent.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);
}

const createGUnder = parent =>
      parent.append("g")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

function drawBinoms(parent, nps) {
  var lastHeight = 0;
  nps.map(np => {
    const g = createGUnder(parent)
    g.attr("transform", "translate("+0+","+(lastHeight += height-50)+")")
    drawBinom(g, np.n, np.p)
  })
}


d3.select("#dogs")
  .attr("width", 800)
  .attr("height", 800)

drawBinoms(d3.select("#dogs"),
           [{"n": 20, "p": .5},
            {"n": 2, "p": .5}].concat(
              _.map(_.range(.01, 1, 0.1), x => {return {"n": 5, "p": x}})))



