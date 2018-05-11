import zoom from './zoom';
import pan from './pan';
import processTrace from './processTrace';
import { saveState, loadState } from './localStorage';
import trimTextMiddle from './trimText';
import deepArrayIsEqual from './deepArrayIsEqual';
import shortEnglishHumanizer from './shortEnglishHumanizer';

function findById(idToFind, arr) {
  return !arr ? {} : arr.find(({ id }) => id === idToFind);
}

export {
  deepArrayIsEqual,
  findById,
  loadState,
  pan,
  processTrace,
  saveState,
  shortEnglishHumanizer,
  trimTextMiddle,
  zoom,
};

// Everything below (as well as other stuff dispersed throughout 😜) is borrowed with ❤️ from Chrome DevTools.
/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export const constrain = (num, min, max) => {
  if (num < min) num = min;
  else if (num > max) num = max;
  return num;
};

