/////////////// continuous binomial //////////////////

// http://ac.inf.elte.hu/Vol_039_5013/137_39.pdf
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
  p = Math.pow(p*1.3, 2.4)
  p = Math.max(p, 0+epsilon) // Make sure p isn't exactly 0

  const x = isUpper ? (n+1) - x_in : x_in;

  return ilienko(x, n, p)
}

// generate a continuous binomial distribution for all p in [0, 1]
function binomPoints(n, p, points) {
  const maxN = n + 1.05

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


d3.select("#dogs").attr("width", 800).attr("height", 20000)

var pdfLine = d3.line().curve(d3.curveLinear)
    .x(d => _.round(200 * d.x, 2))
    .y(d => _.round(-2 * d.y, 2));

const pap = x => {console.log(x); return x}

var bars = d3.select("#dogs").selectAll('g').data(_.take(dogs_json, 10))
    .enter()
    .append("g")
    .attr("transform", (d, i) => "translate(50," + (i*70 + 50) + ")")

bars
  .append("path")
  .style("fill", "none")
  .style("stroke", "black") //(d, i) => color(d.name))
  .style("stroke-width", 2)
  .attr("d", (d, i) => pdfLine(binomPoints(d.total, d.pass/d.total, 500)))

bars
  .append("text")
  .text((d, i) => d.name)
  .style("font-family", "'Helvetica', sans-serif")
  .attr("transform", (d, i) => "translate(0," + 20 + ")")

