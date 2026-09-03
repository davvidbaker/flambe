declare module '*.svg' {
  const source: string;
  export default source;
}

declare module '*.png' {
  const source: string;
  export default source;
}

declare module '*.css';

declare const SERVER: string;
declare const SOCKET_SERVER: string;

interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: unknown;
}
