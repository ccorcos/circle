import p5 from "p5";

// create the container with the canvas centered on the page
const root = document.createElement("div");
root.style.display = "flex";
root.style.justifyContent = "center";
document.body.appendChild(root);

// helper functions
const range = (min, max, step) =>
  Array(Math.round((max - min) / step)).fill(0).map((_, i) => i * step + min);

const flatten = list => list.reduce((acc, item) => acc.concat(item), []);

const pipe = (init, fns) => fns.reduce((value, fn) => fn(value), init);

const map = fn => list => list.map(fn);

// the main sketch
var sketch = p => {
  // size of the canvas
  const EDGE = Math.min(window.innerHeight, window.innerWidth) - 20;
  const CENTER = EDGE / 2;
  const RADIUS = EDGE / 6;
  const WIDTH = RADIUS * 2;
  const HEIGHT = RADIUS * 2;
  const ARC = p.TAU / 3;
  const OFFSET = p.TAU / 40;
  const ARMS = 7;
  const SPEED = {
    MIN: 0.0,
    MAX: 0.1
  };

  p.setup = () => {
    p.createCanvas(EDGE, EDGE);
  };

  let tick = 0.0;

  p.draw = () => {
    p.background(51);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(5);

    const x = p.mouseX / EDGE - 0.5;
    const speed = (SPEED.MAX - SPEED.MIN) * x + SPEED.MIN;

    for (let i = 0; i < ARMS; i++) {
      p.push();
      p.translate(CENTER, CENTER);
      p.rotate(i * OFFSET);
      p.rotate(tick + speed);
      p.arc(-RADIUS, 0, WIDTH, HEIGHT, 0, ARC);
      p.arc(+RADIUS, 0, WIDTH, HEIGHT, p.PI, p.PI + ARC);
      p.pop();
    }

    for (let i = 0; i < ARMS; i++) {
      p.push();
      p.translate(CENTER, CENTER);
      p.rotate(i * OFFSET);
      p.rotate(-tick - speed);

      p.arc(-RADIUS, 0, WIDTH, HEIGHT, -ARC, 0);
      p.arc(+RADIUS, 0, WIDTH, HEIGHT, p.PI - ARC, p.PI);
      p.pop();
    }
    tick += speed;
  };
};

const fun = new p5(sketch, root);
