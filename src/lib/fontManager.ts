import { Font } from 'three-stdlib';

let _font: Font | null = null;
let _loading = false;
const _listeners: Array<() => void> = [];

export function getFont(): Font | null {
  if (_font) return _font;
  if (!_loading) {
    _loading = true;
    import('three/examples/fonts/helvetiker_regular.typeface.json').then((fontData) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _font = new Font((fontData as any).default ?? fontData);
      _listeners.forEach(fn => fn());
      _listeners.length = 0;
    }).catch(() => {
      _loading = false;
    });
  }
  return null;
}

export function onFontLoaded(callback: () => void): () => void {
  if (_font) {
    callback();
    return () => {};
  }
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
