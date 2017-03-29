export const range = (min, max, step = 1) =>
  Array(Math.round((max - min) / step)).fill(0).map((_, i) => i * step + min);

export const flatten = list => list.reduce((acc, item) => acc.concat(item), []);

export const pipe = (init, fns) => fns.reduce((value, fn) => fn(value), init);

export const map = fn => list => list.map(fn);

export const random = (min, max) => Math.random() * (max - min) + min;

export const project = ([minIn, maxIn], [minOut, maxOut]) =>
  value => (value - minIn) / (maxIn - minIn) * (maxOut - minOut) + minOut;

export const rotateHue = (h, dh) => {
  const x = (h + dh) % 360;
  return x < 0 ? x + 360 : x;
};
