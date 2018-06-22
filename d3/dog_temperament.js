const pap = x => {console.log(x); return x}

const epsilon = 1e-20


dogs_json.forEach(d => d.pass_rate = d.pass/d.total)

/////////////// UI ////////////////

function updateSliderValue(slider, handle = 0) {
  children = slider.getElementsByClassName('noUi-handle')
  values = _.flatten([slider.noUiSlider.get()])
  _.zip(children, values).forEach(([c, v]) => c.dataset.value = v.replace(/^0/,''))
}

const search_box = document.getElementById('search-box')

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
	range: {'min': 0, 'max': 0.995},
	step: .01,
	start: [.8],
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

const max_wilson_point = (pass, total) => _.maxBy(wilson_points(pass, total, 10), 'y')

const scaled_wilson_points = (pass, total, n_points, limit) => {
  const points = wilson_points(pass, total, n_points)
  const max_y = _.maxBy(points, 'y').y

  if (max_y > limit) {
    points.map(o => _.update(o, 'y', y => y * (limit/max_y))) // mutates points
  }

  return points
}

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

function updateDogs(data) {
  const barkline_height = 70
  const n_dogs = data.length
  const dog_offset = i => (i+1) * barkline_height

  const svg = d3.select("#dogs")
        .attr('height', dog_offset(data.length))
        .attr("width", 400)

  var svgDefs = svg.append('defs');

  var mainGradient = svgDefs.append('linearGradient')
      .attr('id', 'mainGradient');

  const curves = svg.selectAll('.bark-line')
        .data(data.reverse(), (d, i) => [d.name, i])

  const curvesEnter =
        curves.enter()
            .append("g")
            .attr("class", "bark-line")
            .attr("transform", (d, i) => "translate(50," + dog_offset(n_dogs - i - 1) + ")")
            .merge(curves)

  // probability curve
  function bark_line(curvesEnter) {
    curvesEnter
      .append("path")
      .style("fill", "rgba(225,225,225,1)")
      .style("stroke", "black") //(d, i) => color(d.name))
      .style("stroke-width", 2.5)
      .attr("d", (d, i) => pdfLine(scaled_wilson_points(d.pass, d.total, 500, max_bar_height)))
  }

  const max_bar_height = .45*barkline_height
  const bar_trans = y => _.max([y_trans(y), -max_bar_height])
  const conf_height = bar_trans(3);

  function conf_rect(curvesEnter) {
    curvesEnter
      .append("rect")
      .attr("class", "conf-rect")
      .style("fill", "#87ceeb")
      .attrs((d, i) => {
        const {low, high} = wilson(d.pass, d.total, conf_thresh)
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
        const height = conf_height

        return {x1: x_trans(thresh_x), y1: -height,
                x2: x_trans(thresh_x), y2: height}})
  }

  function mid_line(curvesEnter) {
    curvesEnter.append("line")
      .attr("class", "line")
      .style("stroke", "#777")
      .style("stroke-width", 2)
      .style("stroke-dasharray", ("6, 6"))
      .attrs((d, i) => {
        const height = _.find(scaled_wilson_points(d.pass, d.total, 500),
                              o => Math.abs(o.x - d.pass_rate) < 0.01).y

        return {x1: x_trans(d.pass_rate), y1: y_trans(height),
                x2: x_trans(d.pass_rate), y2: 0}})
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
      .attr("transform", (d, i) => "translate(0," + 20 + ")")
      .text((d, i) => d.name + " " + "("+d.pass+"/"+d.total+")")
  }

  d3.selectAll(".conf-rect").remove()
  d3.selectAll(".conf-line").remove()

  // z-depth
  bark_line(curvesEnter)
  mid_line(curvesEnter)
  conf_rect(curvesEnter)
  conf_line(curvesEnter, "low")
  conf_line(curvesEnter, "high")
  //bottom_line(curvesEnter)
  dog_name(curvesEnter)

  curves.exit().remove()
}

const searchByPred = pred => updateDogs(_.take(_.filter(dogs_json, pred), 20))
const searchDogs = params => {
  const {low1, low2, high1, high2, name} = params
  const name_regex = new RegExp(name || ".*", "i")

  return searchByPred(d => {
    const contains_name = name_regex.test(d.name)

    const {low, high} = wilson(d.pass, d.total, conf_thresh)
    const contains_conf = low1 < low && low < low2 && high1 < high && high < high2

    return contains_name && contains_conf
})}

var conf_thresh = 0.8
const setConf = conf => conf_thresh = conf

const lowThreshRange = () => low_thresh_slider.noUiSlider.get().map(parseFloat)
const highThreshRange = () => high_thresh_slider.noUiSlider.get().map(parseFloat)
const nameQuery = () => search_box.value

const dogParams = () => {return {
  name: nameQuery(),
  low1: lowThreshRange()[0],
  low2: lowThreshRange()[1],
  high1: highThreshRange()[0],
  high2: highThreshRange()[1]
}}

const dogParamSearch = () => searchDogs(dogParams())

d3.select("#conf-slider").on("change"/*"input"*/, () => dogParamSearch())
d3.select("#search-box").on("keyup", e => dogParamSearch())
low_thresh_slider.noUiSlider.on('update', ()=>{updateSliderValue(low_thresh_slider); dogParamSearch()})
high_thresh_slider.noUiSlider.on('update', ()=>{updateSliderValue(high_thresh_slider); dogParamSearch()})
conf_slider.noUiSlider.on('update', x => {updateSliderValue(conf_slider); setConf(x)})

dogParamSearch()
