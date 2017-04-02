import React from "react";
import p5 from "p5";
import "p5/lib/addons/p5.sound";
import { css } from "glamor";
import * as u from "./utils";
// the default song to play
import zeddUrl from "../assets/zedd-stay.m4a";

css.global("html, body", {
  padding: 0,
  margin: 0,
  boxSizing: "border-box",
  backgroundColor: "rgb(51, 51, 51)",
  overflow: "hidden"
});

const toolbarWidth = 150;
const linearViewHeight = 400;

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
    backgroundColor: "rgba(51, 51, 51, 0)",
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
      mode: "song",
      // the type of visualizer to show: 'polar' or 'linear'
      view: "polar",
      // whether a song is playing
      playing: true,
      uploading: false,
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
      fullscreen: false
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

  // save a reference to the root node to render the canvas into
  rootRef = node => {
    this.root = node;
  };
  stopScubbing = () => {
    this.setState({ scrubbing: undefined });
  };

  setFullScreen = () => {
    this.setState({ fullscreen: true });
    const el = document.documentElement,
      rfs = el.requestFullscreen ||
        el.webkitRequestFullScreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;

    rfs.call(el);
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
              : styles.hide
          )}
        >
          {this.renderModeSection()}
          {this.renderViewSection()}
          <Button title="fullscreen" onClick={this.setFullScreen} />
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
    new p5(this.sketch, this.root);
    window.onresize = () => {
      this.canvas.resize(window.innerWidth, window.innerHeight);
    };
    document.body.addEventListener("mouseleave", () => {
      this.setState({
        dropping: false
      });
    });
  }
  // reload the entire sketch
  reload = () => {
    this.p.remove();
    new p5(this.sketch, this.root);
  };
  // show the toolbar based on mouse movement
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
    // save the p so we can remove it when we reload
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

    // previous mouse position
    let xy = [0, 0];

    // tell the component if we've moved the mouse
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

    p.preload = () => {
      if (this.state.mode !== "mic") {
        this.song = p.loadSound(this.upload || zeddUrl);
      }
    };

    p.setup = () => {
      this.canvas = p.createCanvas(window.innerWidth, window.innerHeight);

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

    p.draw = () => {
      computeMove([p.mouseX, p.mouseY]);

      // window height
      const height = window.innerHeight;
      const width = window.innerWidth;
      // edge of a square in the middle
      const edge = Math.min(height, width);

      // you can always hold space to show the grid
      const showGrid = p.keyIsDown(" ".charCodeAt()) || this.state.grid;

      // use the state to declaratively pause and play
      if (this.state.playing && !this.song.isPlaying()) {
        this.song.play();
      } else if (!this.state.playing && !this.song.isPaused()) {
        this.song.pause();
      }

      // set the state of the scrubber if we're scrubbing
      Object.keys(this.scrubbers).forEach(name => {
        const [min, max] = this.scrubbers[name];
        if (this.state.scrubbing === name) {
          this.setState({
            [name]: Math.min(
              p.map(p.mouseX, 0, width - toolbarWidth, min, max),
              max
            )
          });
        }
      });

      // some FFT documentation here:
      // https://p5js.org/reference/#/p5.FFT
      // https://p5js.org/reference/#/p5.FFT/getEnergy
      this.fft.analyze();

      // setup the background
      p.background(51);
      p.noFill();

      // no stroke
      p.stroke(255, 255, 255, 255 * 1.0);
      p.strokeWeight(0);

      // sweep hue
      let hue = this.state.hue;

      // padding
      const padding = {
        x: this.state.fullscreen ? 0 : toolbarWidth,
        y: this.state.fullscreen
          ? 0
          : this.state.view === "linear" ? (height - linearViewHeight) / 2 : 50
      };

      const rect = {
        x: padding.x,
        y: padding.y,
        width: width - padding.x * 2,
        height: height - padding.y * 2
      };

      if (this.state.view === "polar") {
        // edge of the square bounding the circle
        const octaveEdge = this.state.overlap ? edge : rect.width / octaves;
        // leave some room to the ourside of the circle
        const octaveRadius = octaveEdge / 3;
        // compure the inner radius to the circle
        const innerRadius = octaveEdge / 6 * this.state.radius;
        // we only want to draw one grid if we're overlayed
        let drawPolarGrid = showGrid;

        // draw each octave
        bands.forEach((band, j) => {
          const center = {
            x: this.state.overlap
              ? rect.x + rect.width / 2
              : rect.x + octaveEdge * (j + 0.5),
            y: rect.y + rect.height / 2
          };

          // draw the grid
          if (drawPolarGrid) {
            if (this.state.overlap) {
              drawPolarGrid = false;
            }

            // draw lines at an angle from the center
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

              // draw the note labels
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

          // draw the circle
          p.strokeWeight(0);
          p.fill(
            p.color(
              `hsla(${Math.round(hue)}, 100%, 50%, ${this.state.opacity})`
            )
          );

          // draw a single frequency vertex using polar coordinates
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

          // draw the shape
          p.beginShape();
          band.forEach(drawVertex);
          // draw the first vertex again to complete the shape
          drawVertex(band[0], 0);
          p.endShape();

          // rotate the hue for the next octave
          hue = u.rotateHue(hue, this.state.sweep);
        });
      } else if (this.state.view === "linear") {
        // width of the octave
        const octaveWidth = this.state.overlap
          ? rect.width
          : rect.width / octaves;

        // if the view if overlapped, we only want to draw the grid once
        let drawLinearGrid = showGrid;

        // draw each octave
        bands.forEach((band, j) => {
          // draw the grid
          if (drawLinearGrid) {
            if (this.state.overlap) {
              drawLinearGrid = false;
            }

            // draw a line for each note
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

          // draw the octave
          p.fill(
            p.color(
              `hsla(${Math.round(hue)}, 100%, 50%, ${this.state.opacity})`
            )
          );
          p.beginShape();
          const xoffset = this.state.overlap ? 0 : octaveWidth * j;
          // create a vertex at the bottom left
          p.vertex(rect.x + xoffset, rect.y + rect.height);
          // draw each of the frequencies
          band.forEach((freq, i) => {
            const x = xoffset + octaveWidth / (steps - 1) * i;
            const y = Math.pow(
              this.fft.getEnergy(freq) / 255,
              this.state.sharpness
            ) *
              rect.height *
              this.state.gain;
            p.vertex(x + rect.x, rect.height - y + rect.y);
          });
          // draw a vertex at the bottom right
          p.vertex(rect.x + xoffset + octaveWidth, rect.y + rect.height);
          // draw a vertex at the bottom left again to complete the shape
          p.vertex(rect.x + xoffset, rect.y + rect.height);
          p.endShape();
          // rotate the hue for the next octave
          hue = u.rotateHue(hue, this.state.sweep);
        });
      }
    };
  };
}
