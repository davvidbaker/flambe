import humanizeDuration from 'humanize-duration';

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  round: true,
  spacer: '',
  delimiter: ' ',
  largest: 2,
  languages: {
    shortEn: {
      y() {
        return 'y';
      },
      mo() {
        return 'mo';
      },
      w() {
        return 'w';
      },
      d() {
        return 'd';
      },
      h() {
        return 'h';
      },
      m() {
        return 'm';
      },
      s() {
        return 's';
      },
      ms() {
        return 'ms';
      },
    },
  },
});

export default shortEnglishHumanizer;
