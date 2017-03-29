import React from "react";
import p5 from "p5";
import "p5/lib/addons/p5.sound";
import { css } from "glamor";
import * as u from "./utils";
import songUrl from "../assets/zedd-stay.m4a";

// some FFT documentation here:
// https://p5js.org/reference/#/p5.FFT
// https://p5js.org/reference/#/p5.FFT/getEnergy

const styles = {
  layout: css({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "row"
  }),
  content: css({
    flex: "1",
    backgroundColor: "white"
  }),
  toolbar: css({
    width: 150,
    // backgroundColor: "rgb(51, 51, 51)"
    backgroundColor: "black"
  })
};

export default class Sketch extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  saveRoot = node => {
    this.root = node;
  };
  onPlay = () => {
    this.song.play();
    this.forceUpdate();
  };
  onPause = () => {
    this.song.pause();
    this.forceUpdate();
  };
  renderPausePlay() {
    if (this.song) {
      if (this.song.isPlaying()) {
        return <button onClick={this.onPause}>pause</button>;
      } else {
        return <button onClick={this.onPlay}>play</button>;
      }
    } else {
      return false;
    }
  }
  render() {
    return (
      <div className={styles.layout}>
        <div className={styles.content} ref={this.saveRoot} />
        <div className={styles.toolbar}>
          {this.renderPausePlay()}
        </div>
      </div>
    );
  }
  componentDidMount() {
    new p5(this.sketch, this.root);
    window.onresize = this.onResize;
  }
  deriveSizes() {
    // size of the canvas
    const rect = this.root.getBoundingClientRect();
    this.HEIGHT = rect.height;
    this.WIDTH = rect.width;
    // edge of a square in the middle
    this.EDGE = Math.min(this.HEIGHT, this.WIDTH);
    this.CENTERX = this.WIDTH / 2;
    this.CENTERY = this.HEIGHT / 2;
    this.RADIUS = this.EDGE / 3;
  }
  onResize = () => {
    if (this.canvas) {
      this.deriveSizes();
      this.canvas.resize(this.WIDTH, this.HEIGHT);
    }
  };
  sketch = p => {
    this.deriveSizes();

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

    p.preload = () => {
      this.song = p.loadSound(songUrl);
    };

    p.setup = () => {
      this.canvas = p.createCanvas(this.WIDTH, this.HEIGHT);
      p.noFill();

      // using microphone
      // this.mic = new p5.AudioIn();
      // this.mic.start();
      // this.fft = new p5.FFT();
      // this.fft.setInput(this.mic);

      // using a song file
      this.song.setVolume(1.0);
      this.song.playMode("restart");
      this.song.play();
      this.forceUpdate();
      this.fft = new p5.FFT();
      this.fft.setInput(this.song);
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

      let INNER, SHAPE;
      // INNER = p.map(p.mouseY, 0, HEIGHT, 0, EDGE / 6);
      // SHAPE = p.map(p.mouseX, 0, WIDTH, 1, 10);
      INNER = this.EDGE / 8;
      SHAPE = 3;

      // this returns an array of 1024 values but we're going to use getEnergy instead:
      this.fft.analyze();

      const drawVertex = (freq, i) => {
        const radius = Math.pow(this.fft.getEnergy(freq) / 255, SHAPE) *
          (this.RADIUS - INNER) +
          INNER;
        const angle = i / STEPS * p.TAU;
        p.vertex(
          this.CENTERX + radius * Math.cos(angle),
          this.CENTERY + radius * Math.sin(angle)
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
            this.CENTERX,
            this.CENTERY,
            this.CENTERX + this.RADIUS * Math.cos(angle),
            this.CENTERY + this.RADIUS * Math.sin(angle)
          );

          p.textSize(14);
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(255, 255, 255, 255 * 0.2);
          p.text(
            letter,
            this.CENTERX + this.RADIUS * 1.1 * Math.cos(angle),
            this.CENTERY + this.RADIUS * 1.1 * Math.sin(angle)
          );
        });
      }
    };
  };
}
