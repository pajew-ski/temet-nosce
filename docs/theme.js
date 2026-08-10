// Dark/light detection. Plain CSS switches through prefers-color-scheme on its
// own, and the chat widget follows it through the --chat--* properties, so this
// module exists for the one consumer that renders outside the cascade:
// cytoscape, which paints on a canvas and has to be re-styled in JS.
export function getTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function onThemeChange(callback) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    callback(e.matches ? 'dark' : 'light');
  });
}
