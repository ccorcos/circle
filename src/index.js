import p5 from "p5";

// create the container with the canvas centered on the page
const root = document.createElement("div");
root.style.position = "absolute";
root.style.top = 0;
root.style.bottom = 0;
root.style.left = 0;
root.style.right = 0;
root.style.display = "flex";
root.style.justifyContent = "center";
root.style.cursor = "none";
document.body.appendChild(root);

const link = document.createElement("a");
link.href = "https://github.com/ccorcos/spiral";
link.style.position = "absolute";
link.style.bottom = 0;
link.style.right = 0;
link.style.color = "white";
link.style.padding = "4px 8px";
link.style.fontFamily = "sans-serif";
link.text = "source";
document.body.appendChild(link);

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
  const HEIGHT = window.innerHeight;
  const WIDTH = window.innerWidth;
  const EDGE = Math.min(HEIGHT, WIDTH);
  const CENTERX = WIDTH / 2;
  const CENTERY = HEIGHT / 2;
  const RADIUS = EDGE / 6;
  const FRACTION = 40;
  const OFFSET = p.TAU / FRACTION;

  p.setup = () => {
    p.createCanvas(WIDTH, HEIGHT);
  };

  let tick = 0.0;

  const START = [random(0, p.TAU), random(0, p.TAU)];

  // rotations per period?
  const RPP = [random(4, 4.5), random(4.5, 5)];

  p.draw = () => {
    p.background(51);
    p.noFill();
    p.stroke(255, 255, 255, 255 * 1.0);
    p.strokeWeight(3);

    // const speed = p.mouseX / WIDTH * 0.1;
    const speed = random(0.01, 0.03);

    // const x = 0.5;
    const x = p.mouseX / WIDTH || 0.5;
    const arms = Math.ceil(x * (FRACTION / 2));

    const y = p.mouseY / HEIGHT || 0.5;
    const arc = y * p.TAU;

    for (let i = 0; i < arms; i++) {
      p.push();
      p.translate(CENTERX, CENTERY);
      p.rotate(i * OFFSET);
      p.rotate(Math.sin(tick / RPP[0] + START[0]) * RPP[0]);
      p.arc(-RADIUS, 0, RADIUS * 2, RADIUS * 2, 0, arc);
      p.arc(+RADIUS, 0, RADIUS * 2, RADIUS * 2, p.PI, p.PI + arc);
      p.pop();
    }

    for (let i = 0; i < arms; i++) {
      p.push();
      p.translate(CENTERX, CENTERY);
      p.rotate(i * OFFSET);
      p.rotate(Math.sin(tick / RPP[1] + START[1]) * RPP[1]);
      p.arc(-RADIUS, 0, RADIUS * 2, RADIUS * 2, -arc, 0);
      p.arc(+RADIUS, 0, RADIUS * 2, RADIUS * 2, p.PI - arc, p.PI);
      p.pop();
    }
    tick += speed;
  };
};

const fun = new p5(sketch, root);
