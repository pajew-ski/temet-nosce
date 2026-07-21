// Shared dark/light detection. Plain CSS switches through prefers-color-scheme
// on its own; this module exists for the two consumers that render outside the
// cascade and need to react in JS.
export function getTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function onThemeChange(callback) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    callback(e.matches ? 'dark' : 'light');
  });
}
