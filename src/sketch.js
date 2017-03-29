import React from "react";
import p5 from "p5";
import "p5/lib/addons/p5.sound";
import { css } from "glamor";
import * as u from "./utils";
// the default song to play
import zeddUrl from "../assets/zedd-stay.m4a";

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

const toolbarWidth = 150;

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
    width: toolbarWidth,
    backgroundColor: "rgb(51, 51, 51)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 4,
    boxSizing: "border-box"
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
  }),
  section: css({
    borderStyle: "solid",
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 3,
    color: "white",
    textAlign: "center",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    margin: "4px 0"
  }),
  title: css({
    backgroundColor: "white",
    color: "rgb(51, 51, 51)",
    border: "none",
    outline: "none",
    cursor: "pointer",
    padding: "4px 8px",
    textAlign: "center"
  })
};

const Section = props => (
  <div className={styles.section}>
    <button className={styles.title} onClick={props.onClick}>
      {props.title}
    </button>
    {props.children}
  </div>
);

const Button = props => (
  <button className={styles.button} onClick={props.onClick}>
    {props.title}
  </button>
);

// get the first audio file from a drop event
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
      // playing a song or listening from the mic
      playing: true,
      mode: "song",
      // some scrubbable options for all visualizers
      sharpness: 3,
      gain: 1,
      hue: 240,
      sweep: -10,
      opacity: 0.1,
      // scrubbable options only valid for polar visualizer
      radius: 0.8,
      // boolean options
      grid: false,
      overlap: true,
      // whatever field we're scrubbing on
      scrubbing: undefined,
      // show the toolbar when the user is moving the mouse
      showToolbar: false,
      // user is hoving a file over the screen
      dropping: false,
      // the type of visualizer to show: 'polar' or 'linear'
      view: "polar"
    };
    // scrubbable values with min and max ranges
    this.scrubbers = {
      sharpness: [1, 10],
      gain: [0.6, 3],
      hue: [0, 360],
      sweep: [-40, 40],
      radius: [0, 1],
      opacity: [0, 1]
    };
    // params to save to the url
    this.params = [
      "grid",
      "mode",
      "view",
      "overlap",
      "sharpness",
      "gain",
      "hue",
      "sweep",
      "radius",
      "opacity"
    ];
    this.loadUrlParams();
  }
  // load and save params to the url
  componentWillUpdate(nextProps, nextState) {
    this.saveUrlParams(nextState);
  }
  saveUrlParams(state) {
    const params = this.params
      .map(
        name =>
          typeof state[name] === "number"
            ? `${name}=${encodeURIComponent(state[name].toFixed(2))}`
            : `${name}=${encodeURIComponent(state[name])}`
      )
      .join("&");
    window.history.pushState({}, "circle", `?${params}`);
  }
  loadUrlParams() {
    if (window.location.search !== "") {
      const saved = window.location.search
        .slice(1)
        .split("&")
        .map(str => str.split("="))
        .reduce(
          (obj, [name, str]) => {
            try {
              obj[name] = JSON.parse(str);
            } catch (e) {
              // load strings as they are
              obj[name] = str;
            }
            return obj;
          },
          {}
        );
      this.state = { ...this.state, ...saved };
    }
  }
  onDrop = event => {
    event.preventDefault();
    this.upload = getFirstFile(event);
    this.setState(
      {
        dropping: false,
        uploading: false,
        playing: true,
        mode: "song"
      },
      this.reload
    );
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
  setSongMode = () => {
    this.setState({ mode: "song", playing: true }, this.reload);
  };
  setMicMode = () => {
    this.setState({ mode: "mic", playing: false }, this.reload);
  };
  pauseSong = () => {
    this.setState({ playing: false });
  };
  playSong = () => {
    this.setState({ playing: true });
  };
  showUploadOverlay = () => {
    this.setState({
      uploading: true
    });
  };
  hideUploadOverlay = () => {
    this.setState({
      uploading: false,
      dropping: false
    });
  };
  renderModeSection() {
    if (this.state.mode === "mic") {
      return <Section title="mode: mic" onClick={this.setSongMode} />;
    } else {
      const pauseButton = <Button onClick={this.pauseSong} title="pause" />;
      const playButton = <Button onClick={this.playSong} title="play" />;
      const uploadButton = (
        <Button onClick={this.showUploadOverlay} title="upload" />
      );
      const cancelButton = (
        <Button onClick={this.hideUploadOverlay} title="cancel" />
      );
      return (
        <Section title="mode: song" onClick={this.setMicMode}>
          {this.state.playing ? pauseButton : playButton}
          {this.state.uploading || this.state.dropping
            ? cancelButton
            : uploadButton}
        </Section>
      );
    }
  }
  setPolarView = () => {
    this.setState({ view: "polar" });
  };
  setLinearView = () => {
    this.setState({ view: "linear" });
  };
  setOverlap = () => {
    this.setState({ overlap: true });
  };
  setSpread = () => {
    this.setState({ overlap: false });
  };
  showGrid = () => {
    this.setState({ grid: true });
  };
  hideGrid = () => {
    this.setState({ grid: false });
  };
  renderViewSection() {
    const overlapButton = <Button title="overlap" onClick={this.setOverlap} />;
    const spreadButton = <Button title="spread" onClick={this.setSpread} />;
    const hideGridButton = <Button title="hide grid" onClick={this.hideGrid} />;
    const showGridButton = <Button title="show grid" onClick={this.showGrid} />;

    if (!this.setScrubbing) {
      this.setScrubbing = {
        sharpness: () => this.setState({ scrubbing: "sharpness" }),
        gain: () => this.setState({ scrubbing: "gain" }),
        hue: () => this.setState({ scrubbing: "hue" }),
        sweep: () => this.setState({ scrubbing: "sweep" }),
        radius: () => this.setState({ scrubbing: "radius" }),
        opacity: () => this.setState({ scrubbing: "opacity" })
      };
    }

    const sharpnessScrubber = (
      <Button
        title={`sharpness: ${this.state.sharpness.toFixed(2)}`}
        onClick={this.setScrubbing.sharpness}
      />
    );
    const gainScrubber = (
      <Button
        title={`gain: ${this.state.gain.toFixed(2)}`}
        onClick={this.setScrubbing.gain}
      />
    );
    const hueScrubber = (
      <Button
        title={`hue: ${this.state.hue.toFixed(2)}`}
        onClick={this.setScrubbing.hue}
      />
    );
    const sweepScrubber = (
      <Button
        title={`sweep: ${this.state.sweep.toFixed(2)}`}
        onClick={this.setScrubbing.sweep}
      />
    );
    const radiusScrubber = (
      <Button
        title={`radius: ${this.state.radius.toFixed(2)}`}
        onClick={this.setScrubbing.radius}
      />
    );
    const opacityScrubber = (
      <Button
        title={`opacity: ${this.state.opacity.toFixed(2)}`}
        onClick={this.setScrubbing.opacity}
      />
    );

    if (this.state.view === "polar") {
      return (
        <Section title="view: polar" onClick={this.setLinearView}>
          {this.state.overlap ? spreadButton : overlapButton}
          {this.state.grid ? hideGridButton : showGridButton}
          {sharpnessScrubber}
          {gainScrubber}
          {hueScrubber}
          {sweepScrubber}
          {opacityScrubber}
          {radiusScrubber}
        </Section>
      );
    } else {
      return (
        <Section title="view: linear" onClick={this.setPolarView}>
          {this.state.overlap ? spreadButton : overlapButton}
          {this.state.grid ? hideGridButton : showGridButton}
          {sharpnessScrubber}
          {gainScrubber}
          {hueScrubber}
          {sweepScrubber}
          {opacityScrubber}
        </Section>
      );
    }
  }

  stopScubbing = () => {
    this.setState({ scrubbing: undefined });
  };
  // save a reference to the root node to render the canvas into
  rootRef = node => {
    this.root = node;
  };
  render() {
    const style = {
      cursor: this.state.scrubbing
        ? "crosshair"
        : this.state.showToolbar ? "default" : "none"
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
            this.state.showToolbar || this.state.scrubbing
              ? styles.show
              : // : styles.hide
                styles.show
          )}
        >
          {this.renderModeSection()}
          {this.renderViewSection()}
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
  reload = () => {
    this.p.remove();
    new p5(this.sketch, this.root);
  };
  deriveSizes() {
    // size of the canvas
    this.height = window.innerHeight;
    this.width = window.innerWidth;
    // edge of a square in the middle
    this.edge = Math.min(this.height, this.width);
  }
  startMoving() {
    window.clearTimeout(this.movingTimerId);
    this.movingTimerId = undefined;
    if (!this.state.showToolbar) {
      this.setState({ showToolbar: true });
    }
  }
  stopMoving() {
    if (this.movingTimerId === undefined) {
      this.movingTimerId = window.setTimeout(
        () => {
          if (this.state.showToolbar) {
            this.setState({ showToolbar: false });
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

    const notes = ["A", "", "B", "C", "", "D", "", "E", "F", "", "G", ""];

    p.preload = () => {
      if (this.state.mode !== "mic") {
        this.song = p.loadSound(this.upload || zeddUrl);
      }
    };

    p.setup = () => {
      this.canvas = p.createCanvas(this.width, this.height);
      p.noFill();

      if (this.state.mode === "mic") {
        this.mic = new p5.AudioIn();
        this.mic.start();
        this.fft = new p5.FFT();
        this.fft.setInput(this.mic);
      } else {
        // using a song file
        this.song.setVolume(1.0);
        this.song.playMode("restart");
        this.song.play();
        this.fft = new p5.FFT();
        this.fft.setInput(this.song);
      }
    };

    // hue offset
    let hoffset = 0;

    let xy = [0, 0];

    const computeMove = ([x1, y1]) => {
      const [x2, y2] = xy;
      const d = Math.abs(x1 - x2) + Math.abs(y1 - y2);
      if (d >= 1 && !this.state.showToolbar) {
        this.startMoving();
      } else if (d < 1 && this.state.showToolbar) {
        this.stopMoving();
      }
      xy = [x1, y1];
    };

    p.draw = () => {
      computeMove([p.mouseX, p.mouseY]);

      const showGrid = p.keyIsDown(" ".charCodeAt()) || this.state.grid;

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
            [name]: Math.min(
              p.map(p.mouseX, 0, this.width - toolbarWidth, min, max),
              max
            )
          });
        }
      });

      p.background(51);
      p.noFill();
      p.stroke(255, 255, 255, 255 * 1.0);
      p.strokeWeight(0);

      this.fft.analyze();

      // HSL color sweep
      let HSPEED = 0;

      let hue = u.rotateHue(this.state.hue, hoffset);

      // padding
      const padding = {
        x: toolbarWidth,
        y: this.state.view === "linear" ? (this.height - 400) / 2 : 50
      };

      const rect = {
        x: padding.x,
        y: padding.y,
        width: this.width - padding.x * 2,
        height: this.height - padding.y * 2
      };

      if (this.state.view === "polar") {
        const octaveEdge = this.state.overlap
          ? this.edge
          : rect.width / octaves;

        const octaveRadius = octaveEdge / 3;

        const innerRadius = octaveEdge / 6 * this.state.radius;

        let drawPolarGrid = showGrid;

        bands.forEach((band, j) => {
          const center = {
            x: this.state.overlap
              ? rect.x + rect.width / 2
              : rect.x + octaveEdge * (j + 0.5),
            y: rect.y + rect.height / 2
          };

          if (drawPolarGrid) {
            if (this.state.overlap) {
              drawPolarGrid = false;
            }
            notes.forEach((letter, i) => {
              p.stroke(255, 255, 255, 255 * 0.2);
              p.strokeWeight(1);
              const angle = i / 12 * p.TAU;
              p.line(
                center.x,
                center.y,
                center.x + octaveRadius * Math.cos(angle),
                center.y + octaveRadius * Math.sin(angle)
              );

              if (this.state.overlap) {
                p.textSize(14);
              } else {
                p.textSize(8);
              }
              p.textAlign(p.CENTER, p.CENTER);
              p.fill(255, 255, 255, 255 * 0.2);
              p.text(
                letter,
                center.x + octaveRadius * 1.1 * Math.cos(angle),
                center.y + octaveRadius * 1.1 * Math.sin(angle)
              );
            });
          }

          p.strokeWeight(0);
          p.fill(
            p.color(
              `hsla(${Math.round(hue)}, 100%, 50%, ${this.state.opacity})`
            )
          );

          const drawVertex = (freq, i) => {
            const radius = Math.pow(
              this.fft.getEnergy(freq) / 255,
              this.state.sharpness
            ) *
              (octaveRadius - innerRadius) *
              this.state.gain +
              innerRadius;
            const angle = i / steps * p.TAU;
            p.vertex(
              center.x + radius * Math.cos(angle),
              center.y + radius * Math.sin(angle)
            );
          };

          p.beginShape();
          band.forEach(drawVertex);
          drawVertex(band[0], 0);
          p.endShape();
          hue = u.rotateHue(hue, this.state.sweep);
        });
      } else if (this.state.view === "linear") {
        const octaveWidth = this.state.overlap
          ? rect.width
          : rect.width / octaves;

        let drawLinearGrid = showGrid;
        bands.forEach((band, j) => {
          if (drawLinearGrid) {
            if (this.state.overlap) {
              drawLinearGrid = false;
            }
            notes.forEach((letter, i) => {
              p.stroke(255, 255, 255, 255 * 0.2);
              p.strokeWeight(1);

              const xoffset = this.state.overlap ? 0 : octaveWidth * j;
              const x = rect.x + xoffset + octaveWidth / 11 * i;
              const bottom = rect.y + rect.height;
              const top = rect.y;
              const above = rect.y - 0.04 * rect.height;

              p.line(x, bottom, x, top);

              if (this.state.overlap) {
                p.textSize(14);
              } else {
                p.textSize(8);
              }
              p.textAlign(p.CENTER, p.CENTER);
              p.fill(255, 255, 255, 255 * 0.2);
              p.text(letter, x, above);
            });
          }

          p.fill(
            p.color(
              `hsla(${Math.round(hue)}, 100%, 50%, ${this.state.opacity})`
            )
          );
          p.beginShape();
          const xoffset = this.state.overlap ? 0 : octaveWidth * j;
          p.vertex(rect.x + xoffset, rect.y + rect.height);
          const drawVertex = (freq, i) => {
            const x = xoffset + octaveWidth / (steps - 1) * i;
            const y = Math.pow(
              this.fft.getEnergy(freq) / 255,
              this.state.sharpness
            ) *
              rect.height *
              this.state.gain;
            p.vertex(x + rect.x, rect.height - y + rect.y);
          };
          band.forEach(drawVertex);
          p.vertex(rect.x + xoffset + octaveWidth, rect.y + rect.height);
          p.vertex(rect.x + xoffset, rect.y + rect.height);
          p.endShape();
          hue = u.rotateHue(hue, this.state.sweep);
        });
      }

      hoffset = u.rotateHue(hoffset, HSPEED);
    };
  };
}
