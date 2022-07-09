let pos_arr = [];
let g_guesses = [];
let g_randomPoints = [];

var nslider = document.getElementById("myNRange");
var noutput = document.getElementById("n_value");
noutput.innerHTML = nslider.value; // Display the default slider value

var pslider = document.getElementById("myPointsSampledRange");
var poutput = document.getElementById("p_value");
poutput.innerHTML = pslider.value; // Display the default slider value

var wslider = document.getElementById("myWRange");
var woutput = document.getElementById("w_value");
woutput.innerHTML = wslider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
nslider.oninput = function () {
  noutput.innerHTML = this.value;
};

// Update the current slider value (each time you drag the slider handle)
pslider.oninput = function () {
  poutput.innerHTML = this.value;
};

// Update the current slider value (each time you drag the slider handle)
wslider.oninput = function () {
  woutput.innerHTML = this.value;
};

// create canvas element and append it to document body
var canvas = document.createElement("canvas");
document.body.appendChild(canvas);

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = "fixed";

// get canvas 2D context and set him correct size
var ctx = canvas.getContext("2d");
resize();

// start position
var startPos = { x: null, y: null };

// last known position
var pos = { x: 0, y: 0 };

window.addEventListener("resize", resize);
document.addEventListener("mousemove", draw);
document.addEventListener("mousedown", setPosition);
document.addEventListener("mouseenter", setPosition);

// new position from mouse event
function setPosition(e) {
  if (e.clientY * 0.9 <= ctx.canvas.height) {
    pos.x = e.clientX;
    pos.y = e.clientY;
  }
}

// resize canvas
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = Math.floor(window.innerHeight * 0.9);
}

function proximity(newPos, radius = 1) {
  withinX = newPos.x - startPos.x < radius;
  withinY = newPos.y - startPos.y < radius;

  return withinX && withinY;
}

function draw(e) {
  if (pos.y <= ctx.canvas.height) {
    // mouse left button must be pressed
    if (e.buttons !== 1) return;

    if (pos_arr.length == 0) {
      startPos = {
        x: pos.x,
        y: pos.y,
      };
      pos_arr.push(startPos);
    } else {
      pos_arr.push({
        x: pos.x,
        y: pos.y,
      });
    }

    if (pos_arr.length > 20 && proximity(pos)) renderCenter();

    ctx.beginPath(); // begin

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
  }
}

async function renderCenter() {
  // TODO: check convex and closed

  document.removeEventListener("mousemove", draw);

  const center = calculateCenter().then((center) => {
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(center.x, center.y, 10, 10);
  });

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function drawNextPoint(x, y, random_points) {
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(x, y, 5, 5);
    ctx.fillStyle = "#4bf2f2";

    random_points.map((point) => ctx.fillRect(point.x, point.y, 4, 4));
    await sleep(10);
    ctx.fillStyle = "#ffffff";
    random_points.map((point) => ctx.fillRect(point.x, point.y, 4, 4));
  }

  const guess = gradientDescent().then(async (process) => {
    for (i = 0; i < g_guesses.length - 1; i++) {
      await drawNextPoint(g_guesses[i].x, g_guesses[i].y, g_randomPoints[i]);
    }
    await sleep(5000).then(() => {
      pos_arr = [];
      g_guesses = [];
      g_randomPoints = [];
      const cvs = document.querySelector("canvas");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      document.addEventListener("mousemove", draw);
    });
  });
}

async function calculateCenter() {
  let xSum = 0;
  let ySum = 0;
  for (let i = 0; i < pos_arr.length; i++) {
    xSum += pos_arr[i].x;
    ySum += pos_arr[i].y;
  }

  return {
    x: xSum / pos_arr.length,
    y: ySum / pos_arr.length,
  };
}

const gradientDescent = async () => {
  let guesses = [];
  let randomPoints_arr = [];

  const randomPoints = (n) => {
    let chosenPoints = [];
    for (let i = 1; i < n; i++) {
      point = pos_arr[Math.floor(Math.random() * pos_arr.length)];
      chosenPoints.push(point);
    }
    randomPoints_arr.push(chosenPoints);
    return chosenPoints;
  };
  const error = (guess, weight = 1, numPoints = Math.floor(pos_arr.length)) => {
    chosenPoints = randomPoints((numPoints * +poutput.innerHTML) / 100);

    let xErrorSum = 0;
    let yErrorSum = 0;

    for (let i in chosenPoints) {
      xErrorSum += chosenPoints[i].x - guess.x;
      yErrorSum += chosenPoints[i].y - guess.y;
    }

    xErrorSum = (xErrorSum / numPoints) * weight;
    yErrorSum = (yErrorSum / numPoints) * weight;

    // console.log({
    //   x: guess.x + xErrorSum,
    //   y: guess.y + yErrorSum,
    // });

    return {
      x: guess.x + xErrorSum,
      y: guess.y + yErrorSum,
    };
  };

  originalPoint = {
    x: Math.floor(Math.random() * window.innerWidth),
    y: Math.floor(Math.random() * window.innerHeight * 0.9),
  };

  guess = error(originalPoint, 1);
  guesses.push(guess);
  guesses.push(error(guesses[guesses.length - 1], +woutput.innerHTML / 100));

  for (let k = 1; k < noutput.innerHTML; k++) {
    guess = error(guesses[guesses.length - 1], +woutput.innerHTML / 100);
    guesses.push(guess);
  }

  g_guesses = guesses;
  g_randomPoints = randomPoints_arr;

  return true;
};
