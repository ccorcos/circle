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

    const spectrum = fft.analyze();
    const length = spectrum.length;

    p.beginShape();
    for (let i = 0; i < length; i++) {
      p.vertex(
        p.map(i, 0, length, 0, WIDTH),
        p.map(spectrum[i], 0, 255, HEIGHT, 0)
      );
    }
    p.endShape();
  };
};

const fun = new p5(sketch, root);
