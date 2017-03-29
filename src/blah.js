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
    this.state = {
      playing: true,
      sharpness: 0.3,
      scrubbing: undefined
    };
  }
  // save a reference to the root node
  rootRef = node => {
    this.root = node;
  };
  play = () => {
    this.setState({ playing: true });
  };
  pause = () => {
    this.setState({ playing: false });
  };
  renderPausePlay() {
    if (this.state.playing) {
      return <button onClick={this.pause}>pause</button>;
    } else {
      return <button onClick={this.play}>play</button>;
    }
  }
  scrubSharpness = () => {
    this.setState({ scrubbing: "sharpness" });
  };
  renderSharpness() {
    if (this.state.scrubbing === "sharpness") {
      return <button>sharpness {this.state.sharpness}</button>;
    } else {
      return (
        <button onClick={this.scrubSharpness}>
          sharpness {this.state.sharpness}
        </button>
      );
    }
  }
  stopScubbing = () => {
    this.setState({ scrubbing: undefined });
  };
  render() {
    return (
      <div className={styles.layout}>
        <div
          className={styles.content}
          onClick={this.stopScubbing}
          ref={this.rootRef}
        />
        <div className={styles.toolbar}>
          {this.renderPausePlay()}
          {this.renderSharpness()}
        </div>
      </div>
    );
  }
  componentDidMount() {
    this.deriveSizes();
    new p5(this.sketch, this.root);
    window.onresize = () => {
      this.deriveSizes();
      this.canvas.resize(this.width, this.height);
    };
  }
  deriveSizes() {
    // size of the canvas
    const rect = this.root.getBoundingClientRect();
    this.height = rect.height;
    this.width = rect.width;
    // edge of a square in the middle
    this.edge = Math.min(this.height, this.width);
    this.center = {};
    this.center.x = this.width / 2;
    this.center.y = this.height / 2;
    this.radius = this.edge / 3;
  }
  sketch = p => {
    // A0 is 27.5Hz which is below C1
    const fmin = 27.5;
    // 7 octaves on a piano, lets use 8
    const octaves = 8;
    // steps per octave to sample
    const steps = 24;
    // generate the frequencies for each octave band
    const bands = u.range(0, octaves).map(o => {
      return u.range(0, steps).map(s => {
        // this calculation is related to how you find the frequency of a note on a piano: f = 2 ^ (n / 12)
        return Math.pow(2, o + s / steps) * fmin;
      });
    });

    p.preload = () => {
      this.song = p.loadSound(songUrl);
    };

    p.setup = () => {
      this.canvas = p.createCanvas(this.width, this.height);
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
      this.fft = new p5.FFT();
      this.fft.setInput(this.song);
    };

    // hue offset
    let hoffset = 0;

    p.draw = () => {
      if (this.state.playing && !this.song.isPlaying()) {
        this.song.play();
      }
      if (!this.state.playing && !this.song.isPaused()) {
        this.song.pause();
      }
      p.background(51);
      p.noFill();
      p.stroke(255, 255, 255, 255 * 1.0);
      p.strokeWeight(0);

      // inner and outer radius of the circle
      // exponentiate amplitude to give more shape to the circles

      let innerRadius;
      // innerRadius = p.map(p.mouseY, 0, HEIGHT, 0, EDGE / 6);
      // sharpness = p.map(p.mouseX, 0, WIDTH, 1, 10);
      innerRadius = this.edge / 8;

      if (this.state.scrubbing === "sharpness") {
        this.setState({
          sharpness: p.map(p.mouseX, 0, this.width, 0, 1)
        });
      }

      const sharpness = p.map(this.state.sharpness, 0, 1, 1, 10);

      // this returns an array of 1024 values but we're going to use getEnergy instead:
      this.fft.analyze();

      const drawVertex = (freq, i) => {
        const radius = Math.pow(this.fft.getEnergy(freq) / 255, sharpness) *
          (this.radius - innerRadius) +
          innerRadius;
        const angle = i / steps * p.TAU;
        p.vertex(
          this.center.x + radius * Math.cos(angle),
          this.center.y + radius * Math.sin(angle)
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

      bands.forEach(band => {
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
            this.center.x,
            this.center.y,
            this.center.x + this.radius * Math.cos(angle),
            this.center.y + this.radius * Math.sin(angle)
          );

          p.textSize(14);
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(255, 255, 255, 255 * 0.2);
          p.text(
            letter,
            this.center.x + this.radius * 1.1 * Math.cos(angle),
            this.center.y + this.radius * 1.1 * Math.sin(angle)
          );
        });
      }
    };
  };
}
