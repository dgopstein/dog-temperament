const pap = x => {console.log(x); return x}

/////////////// UI ////////////////

const slider = document.getElementById('searchslider')
noUiSlider.create(slider, {
	range: {'min': 0, 'max': 1},
	step: .01,
	start: [ .7, 1],
  connect: true,

})

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

var pdfLine = d3.line()//.curve(d3.curveClosed)
    .x(d => _.round(250 * d.x, 2))
    .y(d => _.round(-1 * d.y, 2));

function update(data) {
  const dog_offset = i => (i+1) * 70

  const svg = d3.select("#dogs")
        .attr('height', dog_offset(data.length))
        .attr("width", 400)


  const bars = svg.selectAll('g').data(data, (d, i) => [i, d.name])

  const barsEnter =
        bars.enter()
            .append("g")
            .attr("transform", (d, i) => "translate(50," + dog_offset(i) + ")")
            .merge(bars)

  barsEnter
    .append("path")
    .style("fill", "lightgray")
    .style("stroke", "black") //(d, i) => color(d.name))
    .style("stroke-width", 2.5)
    .attr("d", (d, i) => pdfLine(binomPoints(d.total, d.pass/d.total, 500)))

  barsEnter
    .append("text")
    .style("font-family", "'Open Sans', 'Helvetica', sans-serif")
    .attr("transform", (d, i) => "translate(0," + 20 + ")")
    .text((d, i) => d.name + " " + "("+d.pass+"/"+d.total+")")

  bars.exit().remove()
}

const searchByPred = pred => update(_.take(_.filter(dogs_json, pred), 100))
const searchByName = search_term => searchByPred(d => new RegExp(search_term || ".*", "i").test(d.name))
const searchByRange = (low, high) => searchByPred(d => low < d.pass/d.total && d.pass/d.total < high)

searchByName()

d3.select("#searchbox").on("keyup", d => searchByName(d3.event.target.value))
slider.noUiSlider.on('update', ([low,high]) => searchByRange(low, high))
