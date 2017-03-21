// inspiration:
// http://i.imgur.com/7YNW1p0.gifv
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

const random = (min, max) => Math.random() * (max - min) + min;

// the main sketch
var sketch = p => {
  // size of the canvas
  const EDGE = Math.min(window.innerHeight, window.innerWidth) - 20;
  const CENTER = EDGE / 2;
  const RADIUS = EDGE / 6;
  const WIDTH = RADIUS * 2;
  const HEIGHT = RADIUS * 2;
  const FRACTION = 40;
  const OFFSET = p.TAU / FRACTION;

  p.setup = () => {
    p.createCanvas(EDGE, EDGE);
  };

  let tick = 0.0;

  const START = [random(0, p.TAU), random(0, p.TAU)];

  // rotations per period?
  const RPP = [random(4, 4.5), random(4.5, 5)];

  p.draw = () => {
    p.background(51);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(5);

    // const speed = p.mouseX / EDGE * 0.1;
    const speed = random(0.01, 0.03);

    const x = p.mouseX;
    // const x = Math.sin(tick) * EDGE;
    const arms = Math.ceil(x / EDGE * (FRACTION / 2 - 1));

    const y = p.mouseY;
    const arc = y / EDGE * p.TAU;

    for (let i = 0; i < arms; i++) {
      p.push();
      p.translate(CENTER, CENTER);
      p.rotate(i * OFFSET);
      p.rotate(Math.sin(tick / RPP[0] + START[0]) * RPP[0]);
      p.arc(-RADIUS, 0, WIDTH, HEIGHT, 0, arc);
      p.arc(+RADIUS, 0, WIDTH, HEIGHT, p.PI, p.PI + arc);
      p.pop();
    }

    for (let i = 0; i < arms; i++) {
      p.push();
      p.translate(CENTER, CENTER);
      p.rotate(i * OFFSET);
      p.rotate(Math.sin(tick / RPP[1] + START[1]) * RPP[1]);
      p.arc(-RADIUS, 0, WIDTH, HEIGHT, -arc, 0);
      p.arc(+RADIUS, 0, WIDTH, HEIGHT, p.PI - arc, p.PI);
      p.pop();
    }
    tick += speed;
  };
};

const fun = new p5(sketch, root);
