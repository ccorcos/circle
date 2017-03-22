import p5 from "p5";
import "p5/lib/addons/p5.sound"; // assigns values to the p5 object prototype
import songUrl from "../assets/zedd-stay.m4a";

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
link.href = "https://github.com/ccorcos/circle";
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

const project = ([minIn, maxIn], [minOut, maxOut]) =>
  value => (value - minIn) / (maxIn - minIn) * (maxOut - minOut) + minOut;

// normalize the spectrum
const normalize = spectrum => {
  const nf = project([0, spectrum.length], [0, 1]);
  const na = project([0, 255], [0, 1]);
  return spectrum.map((x, i) => ({
    f: nf(i),
    a: na(x)
  }));
};

// the main sketch
const sketch = p => {
  // size of the canvas
  const HEIGHT = window.innerHeight;
  const WIDTH = window.innerWidth;
  const EDGE = Math.min(HEIGHT, WIDTH);
  const CENTERX = WIDTH / 2;
  const CENTERY = HEIGHT / 2;
  const RADIUS = EDGE / 6;

  let mic, fft, song;

  p.preload = () => {
    song = p.loadSound(songUrl);
  };

  p.setup = () => {
    song.setVolume(0.1);
    song.play();
    p.createCanvas(WIDTH, HEIGHT);
    p.noFill();
    // mic = new p5.AudioIn();
    // mic.start();
    fft = new p5.FFT();
    // fft.setInput(mic);
    fft.setInput(song);
  };

  p.draw = () => {
    p.background(51);
    p.noFill();
    p.stroke(255, 255, 255, 255 * 1.0);
    p.strokeWeight(1);

    const spectrum = normalize(fft.analyze());

    p.beginShape();
    spectrum.forEach(({ f, a }) => {
      p.vertex(f * WIDTH, HEIGHT - a * HEIGHT);
    });
    p.endShape();
  };
};

const fun = new p5(sketch, root);
