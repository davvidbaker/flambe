import * as React from 'react';
import swyzzle from 'swyzzle';

/* ⚠️ don't forget you were going to escape the boundaries of the original image and melt elsewhere */
const Swyzzler = ({ canvas }) => {
  const [timeout_id, setTimeout_id] = React.useState(null);

  // setTimeout_id(
  //   setTimeout(() => {
  //     const cleanup = swyzzle(canvas, '#chart-wrapper');
  //   }, 1000 * 10),
  // );

  // const reset = () => clearTimeout(timeout_id);

  React.useEffect(() => {
    // let cleanupSwyzzle = () => {};
    // const handleBlur = () => {
    //   cleanupSwyzzle = swyzzle(canvas, '#chart-wrapper');
    //   console.log('swyzz init');
    // };
    // window.addEventListener('blur', handleBlur);
    // window.addEventListener('focus', () => {
    //   console.log('window focused');
    //   cleanupSwyzzle();
    //   cleanupSwyzzle = () => {};
    // });
    // return () => {
    //   cleanupSwyzzle();
    //   window.removeEventListener('blur', handleBlur);
    // };
  });

  return null;
  // return 'asdf';
};

export default Swyzzler