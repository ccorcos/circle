import p5 from "p5";
// p5.sound assigns values to the p5 object prototype
import "p5/lib/addons/p5.sound";
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
// root.style.cursor = "none";
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
const range = (min, max, step = 1) =>
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
  // canvas size
  const HEIGHT = window.innerHeight;
  const WIDTH = window.innerWidth;
  // edge of a square in the middle
  const EDGE = Math.min(HEIGHT, WIDTH);
  const CENTERX = WIDTH / 2;
  const CENTERY = HEIGHT / 2;
  // inner and outer radius of the circle
  const INNER = EDGE / 6;
  const RADIUS = EDGE / 2 - INNER;

  // some FFT documentation here:
  // https://p5js.org/reference/#/p5.FFT
  const FMAX = 44100 / 2;
  // we get 1024 frequency bins back from the FFT
  const BINS = 1024;
  // A0 is 27.5Hz which is below C1
  const FSTART = 27.5;
  // 7 octaves on a piano, lets use 8
  const OCTAVES = 8;
  // steps per octave to sample
  const STEPS = 24;
  // generate the frequencies for each octave band
  const BANDS = range(0, OCTAVES).map(o => {
    return range(0, STEPS).map(s => {
      // this calculation is related to how you find the frequency of a note on a piano: f = 2 ^ (n / 12)
      return Math.pow(2, o + s / STEPS) * FSTART;
    });
  });
  // HSL color sweep
  const HSTART = 240;
  const HSTEP = -10;

  let mic, fft, song;

  p.preload = () => {
    song = p.loadSound(songUrl);
  };

  p.setup = () => {
    p.createCanvas(WIDTH, HEIGHT);
    p.noFill();

    // using microphone
    // mic = new p5.AudioIn();
    // mic.start();
    // fft = new p5.FFT();
    // fft.setInput(mic);

    // using a song file
    song.setVolume(0.1);
    song.play();
    fft = new p5.FFT();
    fft.setInput(song);
  };

  p.draw = () => {
    p.background(51);
    p.noFill();
    p.stroke(255, 255, 255, 255 * 1.0);
    p.strokeWeight(0);

    // this returns an array of 1024 values but we're going to use getEnergy instead:
    // https://p5js.org/reference/#/p5.FFT/getEnergy
    fft.analyze();

    const drawVertex = (freq, i) => {
      const radius = fft.getEnergy(freq) / 255 * RADIUS + INNER;
      const angle = i / STEPS * p.TAU;
      p.vertex(
        CENTERX + radius * Math.cos(angle),
        CENTERY + radius * Math.sin(angle)
      );
    };

    let hue = HSTART;

    BANDS.forEach(band => {
      p.fill(p.color(`hsla(${hue}, 100%, 50%, 0.1)`));
      p.beginShape();
      band.forEach(drawVertex);
      drawVertex(band[0], 0);
      p.endShape();
      hue += HSTEP;
    });
  };
};

const fun = new p5(sketch, root);

// TODO.
// - continuous hue rotation
// - play a nocturne-15
// - gridlines for different keys
