import React from "react";
import p5 from "p5";
import "p5/lib/addons/p5.sound";
import { css } from "glamor";
import * as u from "./utils";
import songUrl from "../assets/zedd-stay.m4a";

export default class Sketch extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  saveRoot = node => {
    this.root = node;
  };
  render() {
    return <div ref={this.saveRoot} />;
  }
  componentDidMount() {
    new p5(this.sketch, this.root);
  }
  sketch = p => {
    // canvas size
    const HEIGHT = window.innerHeight;
    const WIDTH = window.innerWidth;
    // edge of a square in the middle
    const EDGE = Math.min(HEIGHT, WIDTH);
    const CENTERX = WIDTH / 2;
    const CENTERY = HEIGHT / 2;

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
    const BANDS = u.range(0, OCTAVES).map(o => {
      return u.range(0, STEPS).map(s => {
        // this calculation is related to how you find the frequency of a note on a piano: f = 2 ^ (n / 12)
        return Math.pow(2, o + s / STEPS) * FSTART;
      });
    });

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
      song.setVolume(1.0);
      song.playMode("restart");
      song.play();
      fft = new p5.FFT();
      fft.setInput(song);
    };

    // hue offset
    let hoffset = 0;

    p.draw = () => {
      p.background(51);
      p.noFill();
      p.stroke(255, 255, 255, 255 * 1.0);
      p.strokeWeight(0);

      // inner and outer radius of the circle
      // exponentiate amplitude to give more shape to the circles
      const RADIUS = EDGE / 3;
      let INNER, SHAPE;
      // INNER = p.map(p.mouseY, 0, HEIGHT, 0, EDGE / 6);
      // SHAPE = p.map(p.mouseX, 0, WIDTH, 1, 10);
      INNER = EDGE / 8;
      SHAPE = 3;

      // this returns an array of 1024 values but we're going to use getEnergy instead:
      // https://p5js.org/reference/#/p5.FFT/getEnergy
      fft.analyze();

      const drawVertex = (freq, i) => {
        const radius = Math.pow(fft.getEnergy(freq) / 255, SHAPE) *
          (RADIUS - INNER) +
          INNER;
        const angle = i / STEPS * p.TAU;
        p.vertex(
          CENTERX + radius * Math.cos(angle),
          CENTERY + radius * Math.sin(angle)
        );
      };

      // HSL color sweep
      let HSTART, HSTEP, HSPEED;
      // // dynamically set the hue with the mouse position
      // HSTART = p.mouseX === 0 ? 240 : p.map(p.mouseX, 0, WIDTH, 0, 360);
      // HSTEP = p.mouseY === 0 ? -10 : p.map(p.mouseY, 0, WIDTH, -30, 30);
      // hard coded hue values
      HSTART = 240;
      HSTEP = -10;

      // HSPEED = hspeed;
      HSPEED = 0;

      let hue = u.rotateHue(HSTART, hoffset);

      BANDS.forEach(band => {
        p.fill(p.color(`hsla(${Math.round(hue)}, 100%, 50%, 0.1)`));
        p.beginShape();
        band.forEach(drawVertex);
        drawVertex(band[0], 0);
        p.endShape();
        hue = u.rotateHue(hue, HSTEP);
      });

      hoffset = u.rotateHue(hoffset, HSPEED);

      if (p.keyIsDown(" ".charCodeAt())) {
        p.stroke(255, 255, 255, 255 * 0.2);
        p.strokeWeight(1);
        [
          "A",
          "",
          "B",
          "C",
          "",
          "D",
          "",
          "E",
          "F",
          "",
          "G",
          ""
        ].forEach((letter, i) => {
          const angle = i / 12 * p.TAU;
          p.line(
            CENTERX,
            CENTERY,
            CENTERX + RADIUS * Math.cos(angle),
            CENTERY + RADIUS * Math.sin(angle)
          );

          p.textSize(14);
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(255, 255, 255, 255 * 0.2);
          p.text(
            letter,
            CENTERX + RADIUS * 1.1 * Math.cos(angle),
            CENTERY + RADIUS * 1.1 * Math.sin(angle)
          );
        });
      }
    };
  };
}
