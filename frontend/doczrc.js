const webpack = require('webpack');

const themeConfig = {
  /**
   * Mode
   */
  mode: 'light', // you can use: 'dark' or 'light'
  /**
   * Customize codemirror theme
   */
  codemirrorTheme: 'docz-light',
  /**
   * Logo
   */
  logo: {
    src: null,
    width: null,
  },
  /**
   * Colors (depends on select mode)
   */
  colors: {
    white: '#FFFFFF',
    grayExtraLight: '#EEF1F5',
    grayLight: '#CED4DE',
    gray: '#7D899C',
    grayDark: '#2D3747',
    grayExtraDark: '#1D2330',
    dark: '#13161F',
    blue: '#0B5FFF',
    skyBlue: '#1FB6FF',
    /** properties bellow depends on mode select */
    // primary: colors.blue,
    // text: colors.dark,
    // link: colors.blue,
    // footerText: colors.grayDark,
    // sidebarBg: colors.grayExtraLight,
    // sidebarText: colors.dark,
    // background: colors.white,
    // border: colors.grayLight,
    // theadColor: colors.gray,
    // theadBg: colors.grayExtraLight,
    // tableColor: colors.dark,
    // tooltipBg: colors.dark,
    // tooltipColor: colors.grayExtraLight,
    // codeBg: colors.grayExtraLight,
    // codeColor: colors.gray,
    // preBg: colors.grayExtraLight,
    // blockquoteBg: colors.grayExtraLight,
    // blockquoteBorder: colors.grayLight,
    // blockquoteColor: colors.gray,
  },
  /**
   * Styles
   */
  styles: {
    body: {
      fontFamily: 'sans-serif',
      fontSize: 12,
      lineHeight: 1,
    },
    container: {
      width: 920,
      padding: ['20px 30px', '0 40px 40px'],
    },
    h1: {
      margin: ['40px 0 20px', '60px 0 20px', '40px 0'],
      fontSize: [36, 42, 48],
      fontWeight: 100,
      letterSpacing: '-0.02em',
    },
    h2: {
      margin: ['20px 0 20px', '35px 0 20px'],
      lineHeight: ['1.2em', '1.5em'],
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      margin: '25px 0 10px',
      fontSize: [22, 24],
      fontWeight: 400,
    },
    h4: {
      fontSize: 20,
      fontWeight: 400,
    },
    h5: {
      fontSize: 18,
      fontWeight: 400,
    },
    h6: {
      fontSize: 16,
      fontWeight: 400,
    },
    list: {
      padding: 0,
      margin: '10px 0 10px 20px',
    },
    playground: {
      padding: ['1.5em', '2em'],
    },
    code: {
      margin: '0 3px',
      padding: '4px 6px',
      borderRadius: '3px',
      fontFamily: '"Source Code Pro", monospace',
      fontSize: 14,
    },
    pre: {
      fontFamily: '"Source Code Pro", monospace',
      fontSize: 14,
      lineHeight: 1.8,
    },
    table: {
      marginBottom: [20, 40],
      fontFamily: '"Source Code Pro", monospace',
      fontSize: 14,
    },
    blockquote: {
      margin: '25px 0',
      padding: '20px',
      fontStyle: 'italic',
      fontSize: 18,
    },
  },
};

export default {
  indexHtml: './packages/core/docz/template.html',
  src: './',
  themeConfig,
  wrapper: 'packages/core/docz/wrapper.js',
  modifyBundlerConfig: config =>
    console.log(`🔥 config`, config) || {
      ...config,
      plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
          SERVER: "'http://localhost:4000'",
          SOCKET_SERVER: "'ws://localhost:4000'",
          NODE_ENV: "'development'",
        }),
      ],
    },
};
