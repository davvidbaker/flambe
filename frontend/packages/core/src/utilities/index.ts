import zoom from './zoom';
import pan from './pan';
import processTrace from './processTrace';
import { saveState, loadState } from './localStorage';
import trimTextMiddle from './trimText';
import deepArrayIsEqual from './deepArrayIsEqual';
import shortEnglishHumanizer from './shortEnglishHumanizer';

function findById<T extends { id: unknown }>(idToFind: unknown, arr?: T[]): T | Record<string, never> | undefined {
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
export const constrain = (num: number, min: number, max: number): number => {
  if (num < min) num = min;
  else if (num > max) num = max;
  return num;
};
