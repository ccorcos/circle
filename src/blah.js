import React from "react";
import p5 from "p5";
import "p5/lib/addons/p5.sound";
import { css } from "glamor";
import * as u from "./utils";
import songUrl from "../assets/zedd-stay.m4a";
// import songUrl from "../assets/nocturne-15.m4a";

// some FFT documentation here:
// https://p5js.org/reference/#/p5.FFT
// https://p5js.org/reference/#/p5.FFT/getEnergy

css.global("html, body", {
  padding: 0,
  margin: 0,
  boxSizing: "border-box",
  backgroundColor: "rgb(51, 51, 51)",
  overflow: "hidden"
});

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
    flex: "1"
  }),
  toolbar: css({
    position: "absolute",
    left: "100%",
    top: 0,
    bottom: 0,
    width: 150,
    backgroundColor: "rgb(51, 51, 51)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  }),
  show: css({
    transform: "translateX(-150px)",
    transition: "transform 0.2s ease-out"
  }),
  hide: css({
    transform: "translateX(0px)",
    transition: "transform 0.2s ease-in"
  }),
  button: css({
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    padding: "4px 8px",
    marginTop: 8,
    textAlign: "center"
  }),
  link: css({
    fontFamily: "sans-serif",
    fontSize: 12,
    textDecoration: "none",
    fontWeight: "normal"
  }),
  dropping: css({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.4)",
    color: "white",
    textTransform: "uppercase",
    fontSize: "32",
    fontWeight: "bold",
    fontFamily: "sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  })
};

const getFirstFile = event => {
  const dt = event.dataTransfer;
  if (dt.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < dt.items.length; i++) {
      if (dt.items[i].kind == "file") {
        const f = dt.items[i].getAsFile();
        if (/audio/.test(f.type)) {
          return f;
        }
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (let i = 0; i < dt.files.length; i++) {
      const f = dt.files[i];
      if (/audio/.test(f.type)) {
        return f;
      }
    }
  }
};

export default class Sketch extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      playing: true,
      sharpness: 3,
      gain: 1,
      hue: 240,
      sweep: -10,
      radius: 0.8,
      grid: false,
      opacity: 0.1,
      scrubbing: undefined,
      moving: false,
      dropping: false
    };
    this.scrubbers = {
      sharpness: [1, 10],
      gain: [0.6, 3],
      hue: [0, 360],
      sweep: [-40, 40],
      radius: [0, 1],
      opacity: [0, 1]
    };
    this.params = ["grid"];
    if (window.location.search !== "") {
      const saved = window.location.search
        .slice(1)
        .split("&")
        .map(str => str.split("="))
        .reduce(
          (obj, [name, str]) => {
            obj[name] = JSON.parse(str);
            return obj;
          },
          {}
        );
      this.state = { ...this.state, ...saved };
    }
  }
  componentWillUpdate(nextProps, nextState) {
    const params = Object.keys(this.scrubbers)
      .map(name => `${name}=${encodeURIComponent(nextState[name].toFixed(2))}`)
      .concat(
        this.params.map(
          name => `${name}=${encodeURIComponent(nextState[name])}`
        )
      )
      .join("&");
    window.history.pushState({}, "circle", `?${params}`);
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
      return (
        <button className={styles.button} onClick={this.pause}>pause</button>
      );
    } else {
      return (
        <button className={styles.button} onClick={this.play}>play</button>
      );
    }
  }
  renderScrubber = label => {
    const setScubber = () => this.setState({ scrubbing: label });
    if (this.state.scrubbing === label) {
      return (
        <button className={styles.button} key={label}>
          {label} {this.state[label].toFixed(2)}
        </button>
      );
    } else {
      return (
        <button className={styles.button} key={label} onClick={setScubber}>
          {label} {this.state[label].toFixed(2)}
        </button>
      );
    }
  };
  renderGridBool() {
    const turnOn = () => this.setState({ grid: true });
    const turnOff = () => this.setState({ grid: false });
    if (this.state.grid) {
      return (
        <button className={styles.button} onClick={turnOff}>grid off</button>
      );
    } else {
      return (
        <button className={styles.button} onClick={turnOn}>grid on</button>
      );
    }
  }
  stopScubbing = () => {
    this.setState({ scrubbing: undefined });
  };
  onDrop = event => {
    event.preventDefault();
    this.upload = getFirstFile(event);
    this.reload();
    this.setState({
      dropping: false,
      uploading: false
    });
  };
  onDragOver = event => {
    // prevent default behavior
    event.preventDefault();
    this.setState({
      dropping: true
    });
  };
  renderDropZone() {
    if (this.state.dropping || this.state.uploading) {
      return (
        <div className={styles.dropping}>
          Drop a music file
        </div>
      );
    } else {
      return false;
    }
  }
  setUploadingTrue = () => {
    this.setState({
      uploading: true
    });
  };
  setUploadingFalse = () => {
    this.setState({
      uploading: false,
      dropping: false
    });
  };
  renderUpload() {
    if (this.state.uploading || this.state.dropping) {
      return (
        <button onClick={this.setUploadingFalse} className={styles.button}>
          cancel
        </button>
      );
    } else {
      return (
        <button onClick={this.setUploadingTrue} className={styles.button}>
          upload
        </button>
      );
    }
  }
  render() {
    const style = {
      cursor: this.state.scrubbing
        ? "crosshair"
        : this.state.moving ? "default" : "none"
    };
    return (
      <div
        style={style}
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
        className={styles.layout}
      >
        <div
          className={styles.content}
          onClick={this.stopScubbing}
          ref={this.rootRef}
        />
        {this.renderDropZone()}
        <div
          className={css(
            styles.toolbar,
            this.state.moving || this.state.scrubbing
              ? styles.show
              : styles.hide
          )}
        >
          {this.renderPausePlay()}
          {this.renderUpload()}
          {this.renderGridBool()}
          {Object.keys(this.scrubbers).map(this.renderScrubber)}
          <a
            href="https://github.com/ccorcos/circle"
            target="_blank"
            className={css(styles.link, styles.button)}
          >
            source code
          </a>
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
    document.body.addEventListener("mouseleave", () => {
      this.setState({
        dropping: false
      });
    });
  }
  reload() {
    this.p.remove();
    new p5(this.sketch, this.root);
  }
  deriveSizes() {
    // size of the canvas
    this.height = window.innerHeight;
    this.width = window.innerWidth;
    // edge of a square in the middle
    this.edge = Math.min(this.height, this.width);
    this.center = {};
    this.center.x = this.width / 2;
    this.center.y = this.height / 2;
    this.radius = this.edge / 3;
  }
  startMoving() {
    window.clearTimeout(this.movingTimerId);
    this.movingTimerId = undefined;
    if (!this.state.moving) {
      this.setState({ moving: true });
    }
  }
  stopMoving() {
    if (this.movingTimerId === undefined) {
      this.movingTimerId = window.setTimeout(
        () => {
          if (this.state.moving) {
            this.setState({ moving: false });
          }
        },
        2500
      );
    }
  }
  sketch = p => {
    this.p = p;
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
      this.song = p.loadSound(this.upload || songUrl);
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

    let xy = [0, 0];

    const computeMove = ([x1, y1]) => {
      const [x2, y2] = xy;
      const d = Math.abs(x1 - x2) + Math.abs(y1 - y2);
      if (d >= 1 && !this.state.moving) {
        this.startMoving();
      } else if (d < 1 && this.state.moving) {
        this.stopMoving();
      }
      xy = [x1, y1];
    };

    p.draw = () => {
      computeMove([p.mouseX, p.mouseY]);

      if (this.state.playing && !this.song.isPlaying()) {
        this.song.play();
      }

      if (!this.state.playing && !this.song.isPaused()) {
        this.song.pause();
      }

      Object.keys(this.scrubbers).forEach(name => {
        const [min, max] = this.scrubbers[name];
        if (this.state.scrubbing === name) {
          this.setState({
            [name]: p.map(p.mouseX, 0, this.width, min, max)
          });
        }
      });

      p.background(51);
      p.noFill();
      p.stroke(255, 255, 255, 255 * 1.0);
      p.strokeWeight(0);

      // inner and outer radius of the circle
      // exponentiate amplitude to give more shape to the circles

      const innerRadius = this.edge / 6 * this.state.radius;

      // this returns an array of 1024 values but we're going to use getEnergy instead:
      this.fft.analyze();

      const drawVertex = (freq, i) => {
        const radius = Math.pow(
          this.fft.getEnergy(freq) / 255,
          this.state.sharpness
        ) *
          (this.radius - innerRadius) *
          this.state.gain +
          innerRadius;
        const angle = i / steps * p.TAU;
        p.vertex(
          this.center.x + radius * Math.cos(angle),
          this.center.y + radius * Math.sin(angle)
        );
      };

      // HSL color sweep
      let HSPEED = 0;

      let hue = u.rotateHue(this.state.hue, hoffset);

      bands.forEach(band => {
        p.fill(
          p.color(`hsla(${Math.round(hue)}, 100%, 50%, ${this.state.opacity})`)
        );
        p.beginShape();
        band.forEach(drawVertex);
        drawVertex(band[0], 0);
        p.endShape();
        hue = u.rotateHue(hue, this.state.sweep);
      });

      hoffset = u.rotateHue(hoffset, HSPEED);

      if (p.keyIsDown(" ".charCodeAt()) || this.state.grid) {
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
