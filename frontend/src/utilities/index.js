import zoom from './zoom';
import pan from './pan';
import processTrace from './processTrace';
import { saveState, loadState } from './localStorage';
import trimTextMiddle from './trimText'

export { zoom, pan, processTrace, saveState, loadState, trimTextMiddle };

// Everything below is borrowed with ❤️ from Chrome DevTools.
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
