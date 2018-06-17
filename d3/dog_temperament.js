const pap = x => {console.log(x); return x}

dogs_json.forEach(d => d.pass_rate = d.pass/d.total)

/////////////// UI ////////////////

const slider = document.getElementById('search-slider')
noUiSlider.create(slider, {
	range: {'min': 0, 'max': 1},
	step: .01,
	start: [ .7, 1],
  connect: true,

})

/////////////// wilson points //////////////////

const wilson = (up, total, conf) => {
  if (total <= 0 || total < up) return 0

  const z = conf ? qnorm(1 - (0.5 * (1 - conf))) : 2.326348
  const phat = up/total, z2 = z*z;

  const base = phat + z2/(2*total)
  const tail =  z*Math.sqrt((phat*(1 - phat) + z2/(4*total))/total)
  const divisor = (1 + z2/total)

  return {low:  (base - tail)/divisor,
          high: (base + tail)/divisor}
}

const wilson_points = (pass, total, n_points) => {
  const increment = 1/(n_points+1)

  const domain = _.range(0, 1-(0.5*increment), increment)

  const wilsons_low = _.map(domain, x => {
    return {bound:  wilson(pass, total, x).low,
            conf: x}})

  const wilsons_high = _.map(domain, x => {
    return {bound:  wilson(pass, total, 1-x).high,
            conf: 1+x}})

  const wilsons = _.concat(wilsons_low, wilsons_high)

  const inverse_diff =
          _.zip(wilsons.slice(0,-1), _.tail(wilsons))
            .map(([x1, x2]) => {
              const diff_conf = x2.conf - x1.conf
              const diff_bound = x2.bound - x1.bound
              const mid_bound = (x1.bound + x2.bound)/2
              return {bound: mid_bound, conf: diff_conf/diff_bound}})

  return _.sortBy(_.filter(inverse_diff.map(o => {return {x: o.bound, y: -o.conf}}), o => o.y > 10e-10), "x")
}


/////////////// D3 Drawing //////////////////

const x_trans = x => _.round(250 * x, 2)
const y_trans = y => _.round(-1 * y, 2)

var pdfLine = d3.line().x(d => x_trans(d.x)).y(d => y_trans(d.y));

function update(data) {
  const dog_offset = i => (i+1) * 70

  const svg = d3.select("#dogs")
        .attr('height', dog_offset(data.length))
        .attr("width", 400)


  const curves = svg.selectAll('g').data(data, (d, i) => [i, d.name])

  const curvesEnter =
        curves.enter()
            .append("g")
            .attr("transform", (d, i) => "translate(50," + dog_offset(i) + ")")
            .merge(curves)

  // probability curve
  curvesEnter
    .append("path")
    .style("fill", "lightgray")
    .style("stroke", "black") //(d, i) => color(d.name))
    .style("stroke-width", 2.5)
    .attr("d", (d, i) => pdfLine(wilson_points(d.pass, d.total, 500)))

  // confidence interval lines
  curvesEnter
    .append("line")
    .style("stroke", "red")
    .style("stroke-width", 2)
    .attrs((d, i) => {
      const {low} = wilson(d.pass, d.total, 0.9)

      return {x1: x_trans(low), y1: y_trans(0),
              x2: x_trans(low), y2: y_trans(40)}
    })

  curvesEnter
    .append("line")
    .style("stroke", "blue")
    .style("stroke-width", 2)
    .attrs((d, i) => {
      const {high} = wilson(d.pass, d.total, 0.9)

      return {x1: x_trans(high), y1: y_trans(0),
              x2: x_trans(high), y2: y_trans(40)}
    })

  // dog name
  curvesEnter
    .append("text")
    .style("font-family", "'Open Sans', 'Helvetica', sans-serif")
    .attr("transform", (d, i) => "translate(0," + 20 + ")")
    .text((d, i) => d.name + " " + "("+d.pass+"/"+d.total+")")

  curves.exit().remove()
}

const searchByPred = pred => update(_.take(_.filter(dogs_json, pred), 10))
const searchByName = search_term => searchByPred(d => new RegExp(search_term || ".*", "i").test(d.name))
const searchByRange = (low, high) => searchByPred(d => low < d.pass_rate && d.pass_rate < high)

searchByName()

d3.select("#search-box").on("keyup", d => searchByName(d3.event.target.value))
slider.noUiSlider.on('update', ([low,high]) => searchByRange(low, high))
