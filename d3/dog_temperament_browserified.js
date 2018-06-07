(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){




mathfn = require('mathfn')
console.log(mathfn)

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

  const regIncBeta = (p, n, x) => {
      return mathfn.incBeta(p, x, n+1-x) /
         mathfn.beta(   x, n+1-x)
  }

function getData(mean, sigma) {
  const n = 100;
  const sample_size = 5;
  var data = [];
  for (var i = 0; i <= n; i++) {
    q = (i/n) * sample_size;
    console.log("q", q)
    //p = distribution.pdf(q);
    p = regIncBeta(.5, sample_size, q);
    el = {
      "q": q/sample_size,
      "p": p
    }
    data.push(el)
  };
  //data.push({"q": sample_size, "p": 0});
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






















},{"mathfn":6}],2:[function(require,module,exports){

var gammaCollection = require('./gamma.js');
var log1p = require('./log.js').log1p;

//
// The beta functions are taken from the jStat library, and modified to fit
// the API and style pattern used in this module.
// See: https://github.com/jstat/jstat/
// License: MIT
// 

//Copyright (c) 2013 jStat
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

function beta(x, y) {
	if (x < 0 || y < 0) {
   throw RangeError('Arguments must be positive.'); 
	}

  // Some special cases
  else if (x === 0 && y === 0) return NaN;
  else if (x === 0 || y === 0) return Infinity;

	// make sure x + y doesn't exceed the upper limit of usable values
  else if (x + y > 170) {
    return Math.exp(gammaCollection.betaln(x, y));
  }

  else {
    return gammaCollection.gamma(x) * gammaCollection.gamma(y) / gammaCollection.gamma(x + y);
  }
}
exports.beta = beta;

function logBeta(x, y) {
  if (x < 0 || y < 0) {
   throw RangeError('Arguments must be positive.'); 
	}

  // Some special cases
  else if (x === 0 && y === 0) return NaN;
  else if (x === 0 || y === 0) return Infinity;
  
  else {
    return gammaCollection.logGamma(x) + gammaCollection.logGamma(y) - gammaCollection.logGamma(x + y);
  }
}
exports.logBeta = logBeta;

// evaluates the continued fraction for incomplete beta function by modified Lentz's method.
function betacf(x, a, b) {
	var fpmin = 1e-30,
		m = 1,
		m2, aa, c, d, del, h, qab, qam, qap;
	// These q's will be used in factors that occur in the coefficients
	qab = a + b;
	qap = a + 1;
	qam = a - 1;
	c = 1;
	d = 1 - qab * x / qap;
	if (Math.abs(d) < fpmin) d = fpmin;
	d = 1 / d;
	h = d;
	for (; m <= 100; m++) {
		m2 = 2 * m;
		aa = m * (b - m) * x / ((qam + m2) * (a + m2));
		// One step (the even one) of the recurrence
		d = 1 + aa * d;
		if (Math.abs(d) < fpmin) d = fpmin;
		c = 1 + aa / c;
		if (Math.abs(c) < fpmin) c = fpmin;
		d = 1 / d;
		h *= d * c;
		aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
		// Next step of the recurrence (the odd one)
		d = 1 + aa * d;
		if (Math.abs(d) < fpmin) d = fpmin;
		c = 1 + aa / c;
		if (Math.abs(c) < fpmin) c = fpmin;
		d = 1 / d;
		del = d * c;
		h *= del;
		if (Math.abs(del - 1.0) < 3e-7) break;
	}
	return h;
}

// Returns the incomplete beta function I_x(a,b)
function incBeta(x, a, b) {
	if(x < 0 || x > 1) {
    throw new RangeError('First argument must be between 0 and 1.');
	}

  // Special cases, there can make trouble otherwise
  else if (a === 1 && b === 1) return x;
  else if (x === 0) return 0;
  else if (x === 1) return 1;
  else if (a === 0) return 1;
  else if (b === 0) return 0;

  else {
    var bt = 
      Math.exp(gammaCollection.logGamma(a + b) -
      gammaCollection.logGamma(a) -
      gammaCollection.logGamma(b) +
      a * Math.log(x) +
      b * log1p(-x));

    // Use continued fraction directly.
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(x, a, b) / a;
    // else use continued fraction after making the symmetry transformation.
    else return 1 - bt * betacf(1 - x, b, a) / b;
  }
}
exports.incBeta = incBeta;

// Returns the inverse of the incomplete beta function
function invIncBeta(p, a, b) {
  if(x < 0 || x > 1) {
    throw new RangeError('First argument must be between 0 and 1.');
	}

  // Special cases, there can make trouble otherwise
  else if (a === 1 && b === 1) return p;
  else if (p === 1) return 1;
  else if (p === 0) return 0;
  else if (a === 0) return 0;
  else if (b === 0) return 1;

  else {
    var EPS = 1e-8,
        a1 = a - 1,
        b1 = b - 1,
        j = 0,
        lna, lnb, pp, t, u, err, x, al, h, w, afac;
  
	if(a >= 1 && b >= 1) {
    pp = (p < 0.5) ? p : 1 - p;
    t = Math.sqrt(-2 * Math.log(pp));

		x = (2.30753 + t * 0.27061) / (1 + t* (0.99229 + t * 0.04481)) - t;
		if(p < 0.5) x = -x;
		al = (x * x - 3) / 6;
		h = 2 / (1 / (2 * a - 1)  + 1 / (2 * b - 1));
		w = (x * Math.sqrt(al + h) / h) - (1 / (2 * b - 1) - 1 / (2 * a - 1)) * (al + 5 / 6 - 2 / (3 * h));
		x = a / (a + b * Math.exp(2 * w));
	} else {
		lna = Math.log(a / (a + b));
		lnb = Math.log(b / (a + b));
		t = Math.exp(a * lna) / a;
		u = Math.exp(b * lnb) / b;
		w = t + u;
		if (p < t / w) x = Math.pow(a * w * p, 1 / a);
		else x = 1 - Math.pow(b * w * (1 - p), 1 / b);
	}

	afac = -gammaCollection.logGamma(a) - gammaCollection.logGamma(b) + gammaCollection.logGamma(a + b);

  for(; j < 10; j++) {
		if(x === 0 || x === 1) return x;
		err = incBeta(x, a, b) - p;

    t = Math.exp(a1 * Math.log(x) + b1 * log1p(-x) + afac);
		u = err / t;
		x -= (t = u / (1 - 0.5 * Math.min(1, u * (a1 / x - b1 / (1 - x)))));

    if (x <= 0) x = 0.5 * (x + t);
		if (x >= 1) x = 0.5 * (x + t + 1);

		if (Math.abs(t) < EPS * x && j > 0) break;
	}

	return x;
  }
}
exports.invIncBeta = invIncBeta;

},{"./gamma.js":4,"./log.js":5}],3:[function(require,module,exports){

//
// Modified from:
//  C++: http://www.johndcook.com/cpp_erf.html
//
var ERF_A = [
  0.254829592,
  -0.284496736,
  1.421413741,
  -1.453152027,
  1.061405429
];
var ERF_P = 0.3275911;

function erf(x) {
  var sign = 1;
  if (x < 0) sign = -1;

  x = Math.abs(x);

  var t = 1.0/(1.0 + ERF_P*x);
  var y = 1.0 - (((((ERF_A[4]*t + ERF_A[3])*t) + ERF_A[2])*t + ERF_A[1])*t + ERF_A[0])*t*Math.exp(-x*x);

  return sign * y;
}
exports.erf = erf;

//
// Combined from two sources:
//  Python: http://pydoc.net/Python/timbre/1.0.0/timbre.stats/
//  JavaScript: https://github.com/jstat/jstat/blob/master/src/special.js
//
var M_2_SQRTPI = 1.12837916709551257;

var ERFC_COF = [
  -2.8e-17, 1.21e-16, -9.4e-17, -1.523e-15, 7.106e-15,
   3.81e-16, -1.12708e-13, 3.13092e-13, 8.94487e-13,
  -6.886027e-12, 2.394038e-12, 9.6467911e-11,
  -2.27365122e-10, -9.91364156e-10, 5.059343495e-9,
   6.529054439e-9, -8.5238095915e-8, 1.5626441722e-8,
   1.303655835580e-6, -1.624290004647e-6,
  -2.0278578112534e-5, 4.2523324806907e-5,
   3.66839497852761e-4, -9.46595344482036e-4,
  -9.561514786808631e-3, 1.9476473204185836e-2,
   6.4196979235649026e-1, -1.3026537197817094
];
var ERFC_COF_LAST = ERFC_COF[ERFC_COF.length - 1];

function erfc(x) {
  function erfccheb(y) {
    var d = 0.0, dd = 0.0, temp = 0.0,
        t = 2.0 / (2.0 + y), ty = 4.0 * t - 2.0;
  
    for (var i = 0, l = ERFC_COF.length - 1; i < l; i++) {
      temp = d;
      d = ty * d - dd + ERFC_COF[i];
      dd = temp;
    }
  
    return t * Math.exp(-y * y + 0.5 * (ERFC_COF_LAST + ty * d) - dd);
  }
  
  return x >= 0.0 ? erfccheb(x) : 2.0 - erfccheb(-x);
}
exports.erfc = erfc;

//
// Combined from three sources:
//  Python: http://pydoc.net/Python/timbre/1.0.0/timbre.stats/
//  JavaScript: https://github.com/jstat/jstat/blob/master/src/special.js
//  C: https://github.com/Peteysoft/sea_ice/blob/master/src/mcc_ice/inverf.c
//
function invErfc(p) {
  if (p < 0.0 || p > 2.0) {
    throw RangeError('Argument must be betweeen 0 and 2');
  }

  else if (p === 0.0) {
    return Infinity;
  }
  
  else if (p === 2.0) {
    return -Infinity;
  }
  
  else {
    var pp = p < 1.0 ? p : 2.0 - p;
    var t = Math.sqrt(-2.0 * Math.log(pp / 2.0));
    var x = -0.70711 * ((2.30753 + t * 0.27061) / (1.0 + t * (0.99229 + t * 0.04481)) - t);

    var err1 = erfc(x) - pp;
    x += err1 / (M_2_SQRTPI * Math.exp(-x * x) - x * err1);
    var err2 = erfc(x) - pp;
    x += err2 / (M_2_SQRTPI * Math.exp(-x * x) - x * err2);

    return p < 1.0 ? x : -x;
  }
}
exports.invErfc = invErfc;

//
// Used math: inverf(x) = -inverfc(1 + x);
//  NOTE: you are welcome to add a specific approximation
//
function invErf(p) {
  if (p < -1.0 || p > 1.0) {
    throw RangeError('Argument must be betweeen -1 and 1');
  }

  return -invErfc(p + 1);
}
exports.invErf = invErf;

},{}],4:[function(require,module,exports){

//
// Modified form:
//  C++: http://www.johndcook.com/cpp_gamma.html
//

// Euler's gamma constant
var GAMMA_CONST = 0.577215664901532860606512090;

// numerator coefficients for approximation over the interval (1,2)
var P_COFF = [
  -1.71618513886549492533811E+0,
   2.47656508055759199108314E+1,
  -3.79804256470945635097577E+2,
   6.29331155312818442661052E+2,
   8.66966202790413211295064E+2,
  -3.14512729688483675254357E+4,
  -3.61444134186911729807069E+4,
   6.64561438202405440627855E+4
];

// denominator coefficients for approximation over the interval (1,2)
var Q_COFF = [
  -3.08402300119738975254353E+1,
   3.15350626979604161529144E+2,
  -1.01515636749021914166146E+3,
  -3.10777167157231109440444E+3,
   2.25381184209801510330112E+4,
   4.75584627752788110767815E+3,
  -1.34659959864969306392456E+5,
  -1.15132259675553483497211E+5
];

function gamma(x) {
  if (x <= 0.0) {
    throw new RangeError('Argument must be positive.');
	}

	// For small x, 1/Gamma(x) has power series x + gamma x^2  - ...
	// So in this range, 1/Gamma(x) = x + gamma x^2 with error on the order of x^3.
	// The relative error over this interval is less than 6e-7.
  else if (x < 0.001) {
    return 1.0/(x*(1.0 + GAMMA_CONST*x));
  }
  
  // The algorithm directly approximates gamma over (1,2) and uses
  // reduction identities to reduce other arguments to this interval.
  else if (x < 12.0) {
    var y = x, n = 0, lessOne = (y < 1.0);

    // Add or subtract integers as necessary to bring y into (1,2)
    if (lessOne) {
      y += 1.0;
    } else {
      n = Math.floor(y) - 1;
      y -= n;
    }
    
    var num = 0.0, den = 1.0, z = y - 1;
    for (var i = 0; i < 8; i++) {
      num = (num + P_COFF[i])*z;
      den = den*z + Q_COFF[i];
    }
    var result = num/den + 1.0;

    // Apply correction if argument was not initially in (1,2)
    if (lessOne) {
      result /= (y-1.0);
    } else {
      // Use the identity gamma(z+n) = z*(z+1)* ... *(z+n-1)*gamma(z)
      for (i = 0; i < n; i++)
        result *= y++;
    }

    return result;
  }

  // Correct answer too large to display. Force +infinity.
  else if (x > 171.624) {
		return Infinity;
  }
  
  else {
    return Math.exp(logGamma(x));
  }
}

// gamma functions goes under two names
exports.gamma = gamma;

//
// Modified form:
//  C++: http://www.johndcook.com/cpp_gamma.html
//

var C_COFF = [
   1.0/12.0,
  -1.0/360.0,
   1.0/1260.0,
  -1.0/1680.0,
   1.0/1188.0,
  -691.0/360360.0,
   1.0/156.0,
  -3617.0/122400.0
];

var HALF_LOG_TWO_PI = 0.91893853320467274178032973640562;

function logGamma(x) {
  if (x <= 0.0) {
    throw new RangeError('Argument must be positive.');
	}

  else if (x < 12.0) {
    return Math.log(Math.abs(gamma(x)));
  }

  // Abramowitz and Stegun 6.1.41
  // Asymptotic series should be good to at least 11 or 12 figures
  // For error analysis, see Whittiker and Watson
  // A Course in Modern Analysis (1927), page 252
  
  else {
    var  z = 1.0/(x*x);
    var sum = C_COFF[7];
    for (var i = 6; i >= 0; i--) {
      sum *= z;
      sum += C_COFF[i];
    }
    var series = sum/x;
    return (x - 0.5)*Math.log(x) - x + HALF_LOG_TWO_PI + series;
  }
}
exports.logGamma = logGamma;

},{}],5:[function(require,module,exports){

//
// Modified from:
//  C++: http://www.johndcook.com/cpp_erf.html
//

function log1p(x) {
  if (x <= -1.0) {
    throw new RangeError('Argument mustbe greater than -1.0');
  }

  // x is large enough that the obvious evaluation is OK
  else if (Math.abs(x) > 1e-4) {
      return Math.log(1.0 + x);
  }

  // Use Taylor approx. log(1 + x) = x - x^2/2 with error roughly x^3/3
  // Since |x| < 10^-4, |x|^3 < 10^-12, relative error less than 10^-8
  else {
    return (-0.5*x + 1.0)*x;
  }
}
exports.log1p = log1p;

//
// Modified from:
//  C++: http://www.johndcook.com/cpp_erf.html
//
var TABLE_LOOKUP = [
  0.000000000000000,
  0.000000000000000,
  0.693147180559945,
  1.791759469228055,
  3.178053830347946,
  4.787491742782046,
  6.579251212010101,
  8.525161361065415,
  10.604602902745251,
  12.801827480081469,
  15.104412573075516,
  17.502307845873887,
  19.987214495661885,
  22.552163853123421,
  25.191221182738683,
  27.899271383840894,
  30.671860106080675,
  33.505073450136891,
  36.395445208033053,
  39.339884187199495,
  42.335616460753485,
  45.380138898476908,
  48.471181351835227,
  51.606675567764377,
  54.784729398112319,
  58.003605222980518,
  61.261701761002001,
  64.557538627006323,
  67.889743137181526,
  71.257038967168000,
  74.658236348830158,
  78.092223553315307,
  81.557959456115029,
  85.054467017581516,
  88.580827542197682,
  92.136175603687079,
  95.719694542143202,
  99.330612454787428,
  102.968198614513810,
  106.631760260643450,
  110.320639714757390,
  114.034211781461690,
  117.771881399745060,
  121.533081515438640,
  125.317271149356880,
  129.123933639127240,
  132.952575035616290,
  136.802722637326350,
  140.673923648234250,
  144.565743946344900,
  148.477766951773020,
  152.409592584497350,
  156.360836303078800,
  160.331128216630930,
  164.320112263195170,
  168.327445448427650,
  172.352797139162820,
  176.395848406997370,
  180.456291417543780,
  184.533828861449510,
  188.628173423671600,
  192.739047287844900,
  196.866181672889980,
  201.009316399281570,
  205.168199482641200,
  209.342586752536820,
  213.532241494563270,
  217.736934113954250,
  221.956441819130360,
  226.190548323727570,
  230.439043565776930,
  234.701723442818260,
  238.978389561834350,
  243.268849002982730,
  247.572914096186910,
  251.890402209723190,
  256.221135550009480,
  260.564940971863220,
  264.921649798552780,
  269.291097651019810,
  273.673124285693690,
  278.067573440366120,
  282.474292687630400,
  286.893133295426990,
  291.323950094270290,
  295.766601350760600,
  300.220948647014100,
  304.686856765668720,
  309.164193580146900,
  313.652829949878990,
  318.152639620209300,
  322.663499126726210,
  327.185287703775200,
  331.717887196928470,
  336.261181979198450,
  340.815058870798960,
  345.379407062266860,
  349.954118040770250,
  354.539085519440790,
  359.134205369575340,
  363.739375555563470,
  368.354496072404690,
  372.979468885689020,
  377.614197873918670,
  382.258588773060010,
  386.912549123217560,
  391.575988217329610,
  396.248817051791490,
  400.930948278915760,
  405.622296161144900,
  410.322776526937280,
  415.032306728249580,
  419.750805599544780,
  424.478193418257090,
  429.214391866651570,
  433.959323995014870,
  438.712914186121170,
  443.475088120918940,
  448.245772745384610,
  453.024896238496130,
  457.812387981278110,
  462.608178526874890,
  467.412199571608080,
  472.224383926980520,
  477.044665492585580,
  481.872979229887900,
  486.709261136839360,
  491.553448223298010,
  496.405478487217580,
  501.265290891579240,
  506.132825342034830,
  511.008022665236070,
  515.890824587822520,
  520.781173716044240,
  525.679013515995050,
  530.584288294433580,
  535.496943180169520,
  540.416924105997740,
  545.344177791154950,
  550.278651724285620,
  555.220294146894960,
  560.169054037273100,
  565.124881094874350,
  570.087725725134190,
  575.057539024710200,
  580.034272767130800,
  585.017879388839220,
  590.008311975617860,
  595.005524249382010,
  600.009470555327430,
  605.020105849423770,
  610.037385686238740,
  615.061266207084940,
  620.091704128477430,
  625.128656730891070,
  630.172081847810200,
  635.221937855059760,
  640.278183660408100,
  645.340778693435030,
  650.409682895655240,
  655.484856710889060,
  660.566261075873510,
  665.653857411105950,
  670.747607611912710,
  675.847474039736880,
  680.953419513637530,
  686.065407301994010,
  691.183401114410800,
  696.307365093814040,
  701.437263808737160,
  706.573062245787470,
  711.714725802289990,
  716.862220279103440,
  722.015511873601330,
  727.174567172815840,
  732.339353146739310,
  737.509837141777440,
  742.685986874351220,
  747.867770424643370,
  753.055156230484160,
  758.248113081374300,
  763.446610112640200,
  768.650616799717000,
  773.860102952558460,
  779.075038710167410,
  784.295394535245690,
  789.521141208958970,
  794.752249825813460,
  799.988691788643450,
  805.230438803703120,
  810.477462875863580,
  815.729736303910160,
  820.987231675937890,
  826.249921864842800,
  831.517780023906310,
  836.790779582469900,
  842.068894241700490,
  847.352097970438420,
  852.640365001133090,
  857.933669825857460,
  863.231987192405430,
  868.535292100464630,
  873.843559797865740,
  879.156765776907600,
  884.474885770751830,
  889.797895749890240,
  895.125771918679900,
  900.458490711945270,
  905.796028791646340,
  911.138363043611210,
  916.485470574328820,
  921.837328707804890,
  927.193914982476710,
  932.555207148186240,
  937.921183163208070,
  943.291821191335660,
  948.667099599019820,
  954.046996952560450,
  959.431492015349480,
  964.820563745165940,
  970.214191291518320,
  975.612353993036210,
  981.015031374908400,
  986.422203146368590,
  991.833849198223450,
  997.249949600427840,
  1002.670484599700300,
  1008.095434617181700,
  1013.524780246136200,
  1018.958502249690200,
  1024.396581558613400,
  1029.838999269135500,
  1035.285736640801600,
  1040.736775094367400,
  1046.192096209724900,
  1051.651681723869200,
  1057.115513528895000,
  1062.583573670030100,
  1068.055844343701400,
  1073.532307895632800,
  1079.012946818975000,
  1084.497743752465600,
  1089.986681478622400,
  1095.479742921962700,
  1100.976911147256000,
  1106.478169357800900,
  1111.983500893733000,
  1117.492889230361000,
  1123.006317976526100,
  1128.523770872990800,
  1134.045231790853000,
  1139.570684729984800,
  1145.100113817496100,
  1150.633503306223700,
  1156.170837573242400
];

function logFactorial(n) {
  if (n < 0) {
    throw new Error('Argument may not be negative.');
  }

  // For big values use a function
  else if (n > 254) {
    var x = n + 1;
    return (x - 0.5)*Math.log(x) - x + 0.5*Math.log(2*Math.PI) + 1.0/(12.0*x);
  }
  
  // For small values use a table lookup
  else {
    return TABLE_LOOKUP[n];
  }
}
exports.logFactorial = logFactorial;

},{}],6:[function(require,module,exports){

var files = ['erf', 'gamma', 'beta', 'log'];

function exportFns(fns) {
  var keys = Object.keys(fns);

  for (var n = 0, r = keys.length; n < r; n++) {
    exports[ keys[n] ] = fns[keys[n]];
  }
}

exportFns(require('./functions/beta.js'));
exportFns(require('./functions/erf.js'));
exportFns(require('./functions/gamma.js'));
exportFns(require('./functions/log.js'));

},{"./functions/beta.js":2,"./functions/erf.js":3,"./functions/gamma.js":4,"./functions/log.js":5}]},{},[1]);
