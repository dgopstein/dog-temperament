const pap = x => {console.log(x); return x}

dogs_json.forEach(d => d.pass_rate = d.pass/d.total)

/////////////// UI ////////////////

const low_thresh_slider = document.getElementById('low-thresh-slider')
noUiSlider.create(low_thresh_slider, {
	range: {'min': 0, 'max': 1},
	step: .01,
	start: [ .5, 1],
  connect: true,
})

const high_thresh_slider = document.getElementById('high-thresh-slider')
noUiSlider.create(high_thresh_slider, {
	range: {'min': 0, 'max': 1},
	step: .01,
	start: [ .8, 1],
  connect: true,
})

const conf_slider = document.getElementById('conf-slider')
noUiSlider.create(conf_slider, {
	range: {'min': 0, 'max': 1},
	step: .01,
	start: [ .8, 1],
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

const epsilon = 1e-20

const max_wilson_point = (pass, total) => _.maxBy(wilson_points(pass, total, 10), 'y')

const wilson_points = (pass, total, n_points) => {
  const increment = 1/(n_points+2)

  const domain = _.concat(_.range(0, 1-(0.5*increment), increment), 1-epsilon)

  return wilson_points_from_domain(pass, total, domain)
}

const wilson_points_from_domain = (pass, total, domain) => {
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

  return _.concat({x: 0, y: 0}, _.sortBy(_.filter(inverse_diff.map(o => {return {x: o.bound, y: -o.conf}}), o => o.y > epsilon), "x"), {x: 1, y:0})
}


/////////////// D3 Drawing //////////////////

const x_trans = x => _.round(250 * x, 2)
const y_trans = y => _.round(-2 * y, 2)

var pdfLine = d3.line().x(d => x_trans(d.x)).y(d => y_trans(d.y));

const revByName = (a, b) => -a.name.toLowerCase().localeCompare(b.name.toLowerCase())

function update(data) {
  const barkline_height = 70
  const n_dogs = data.length
  const dog_offset = i => (i+1) * barkline_height

  const svg = d3.select("#dogs")
        .attr('height', dog_offset(data.length))
        .attr("width", 400)

  var svgDefs = svg.append('defs');

  var mainGradient = svgDefs.append('linearGradient')
      .attr('id', 'mainGradient');

  //mainGradient.append('stop').style("stop-color", "#3f51b5").attr("fill-opacity", "0").attr('offset', '0')
  //mainGradient.append('stop').style("stop-color", "#009688").attr('offset', '1')

  const curves = svg.selectAll('.bark-line')
        .data(data.reverse(), (d, i) => [d.name, i])

  const curvesEnter =
        curves.enter()
            .append("g")
            .attr("class", "bark-line")
            .attr("transform", (d, i) => "translate(50," + dog_offset(n_dogs - i - 1) + ")")
            .merge(curves)

  // confidence interval lines
  d3.selectAll(".conf-rect").remove()

  // probability curve
  function bark_line(curvesEnter) {
    curvesEnter
      .append("path")
      .style("fill", "rgba(225,225,225,1)")
      .style("stroke", "black") //(d, i) => color(d.name))
      .style("stroke-width", 2.5)
      .attr("d", (d, i) => pdfLine(wilson_points(d.pass, d.total, 500)))
  }

  const bar_trans = y => _.max([y_trans(y), -.6*barkline_height])
  const conf_height = bar_trans(3);

  function conf_rect(curvesEnter) {
    curvesEnter
      .append("rect")
      .attr("class", "conf-rect")
    //.style("fill", "url(#mainGradient)")
    //.append("linearGradient", "rgba(60,80,10, .2)")
      .style("fill", "rgba(135, 206, 235, 1)")
      .attrs((d, i) => {
        const {low, high} = wilson(d.pass, d.total, conf_thresh)
        //const height = bar_trans(max_wilson_point(d.pass, d.total).y)
        const height = -conf_height

        return {x: x_trans(low), y: .3*-height,
                height: height*.8,
                width: x_trans(high)-x_trans(low)}
      })
  }

  function conf_line(curvesEnter, thresh_type) {
    curvesEnter
      .append("line")
      .attr("class", "conf-line")
      .style("stroke", "black")
      .style("stroke-width", 3)
      .attrs((d, i) => {
        const thresh_x = wilson(d.pass, d.total, conf_thresh)[thresh_type]
        //const height = bar_trans(max_wilson_point(d.pass, d.total).y)
        const height = conf_height

        return {x1: x_trans(thresh_x), y1: -height,
                x2: x_trans(thresh_x), y2: height}})
  }

  // bottom line
  function bottom_line(curvesEnter) {
    curvesEnter
      .append("line")
      .style("stroke", "black")
      .style("stroke-width", 2.5)
      .attrs({x1: 0, y1: 0, x2: x_trans(1), y2: 0})
  }


  // dog name
  function dog_name(curvesEnter) {
    curvesEnter
      .append("text")
      .style("font-family", "'Open Sans', 'Helvetica', sans-serif")
      .attr("transform", (d, i) => "translate(0," + 20 + ")")
      .text((d, i) => d.name + " " + "("+d.pass+"/"+d.total+")")
  }

  // z-depth
  bark_line(curvesEnter)
  conf_rect(curvesEnter)
  conf_line(curvesEnter, "low")
  conf_line(curvesEnter, "high")
  //bottom_line(curvesEnter)
  dog_name(curvesEnter)

  curves.exit().remove()
}

const searchByPred = pred => update(_.take(_.filter(dogs_json, pred), 10))
const searchByName = search_term => searchByPred(d => new RegExp(search_term || ".*", "i").test(d.name))
const searchByLowHighRange = (low_thresh_low, low_thresh_high, high_thresh_low, high_thresh_high) =>
      searchByPred(d => {
        const {low, high} = wilson(d.pass, d.total, conf_thresh)
        return low_thresh_low < low && low < low_thresh_high &&
               high_thresh_low < high && high < high_thresh_high
      })

var last_search = undefined

const setConf = conf => {
  conf_thresh = conf;
  last_search()
}

var conf_thresh = 0.8

const cache_and_run_search = (f, args) => {
  last_search = () => f.apply(null, args)
  last_search()
}

const lowThreshRange = () => low_thresh_slider.noUiSlider.get().map(parseFloat)
const highThreshRange = () => high_thresh_slider.noUiSlider.get().map(parseFloat)

d3.select("#conf-slider").on("change"/*"input"*/, e => setConf(d3.event.target.value/100))
d3.select("#search-box").on("keyup", e => cache_and_run_search(searchByName, [d3.event.target.value]))
low_thresh_slider.noUiSlider.on('update',
  ([low,high]) => cache_and_run_search(searchByLowHighRange, [low, high].concat(highThreshRange())))
high_thresh_slider.noUiSlider.on('update',
  ([low,high]) => cache_and_run_search(searchByLowHighRange, lowThreshRange().concat([low, high])))

searchByName()
