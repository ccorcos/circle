import p5 from "p5";

// create the container with the canvas centered on the page
const root = document.createElement("div");
root.style.display = "flex";
root.style.justifyContent = "center";
document.body.appendChild(root);

// size of the canvas
const EDGE = Math.min(window.innerHeight, window.innerWidth) - 20;

// helper functions
const range = (min, max, step) =>
  Array(Math.round((max - min) / step)).fill(0).map((_, i) => i * step + min);

const flatten = list => list.reduce((acc, item) => acc.concat(item), []);

const pipe = (init, fns) => fns.reduce((value, fn) => fn(value), init);

const map = fn => list => list.map(fn);

// the main sketch
var sketch = p => {
  p.setup = () => {
    p.createCanvas(EDGE, EDGE);
  };

  p.draw = () => {
    p.background(51);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(5);
    // p.curve(5, 26, 5, 26, 73, 24, 73, 61);

    const points = pipe(range(0, p.TAU, 0.02), [
      // one cycle of a sine wave
      map(i => ({ x: i, y: Math.sin(i) })),
      // scale and move it to the middle
      map(({ x, y }) => ({ x: x / p.TAU * EDGE, y: y * EDGE / 8 + EDGE / 2 }))
    ]);

    p.beginShape();
    points.forEach(({ x, y }) => p.curveVertex(x, y));
    p.endShape();
  };
};

const fun = new p5(sketch, root);
