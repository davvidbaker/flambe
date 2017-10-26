// Everything below is borrowed with ❤️ from Chrome DevTools.

/**
 * @param {number} maxLength
 * @return {string} string that is shortened to contain ellipsis
 */
const trimMiddle = (str, maxLength) => {
  if (str.length <= maxLength) return String(str);
  let leftHalf = maxLength >> 1;
  let rightHalf = maxLength - leftHalf - 1;
  if (str.codePointAt(str.length - rightHalf - 1) >= 0x10000) {
    --rightHalf;
    ++leftHalf;
  }
  if (leftHalf > 0 && str.codePointAt(leftHalf - 1) >= 0x10000) --leftHalf;
  return `${str.substr(0, leftHalf)}\u2026${str.substr(str.length - rightHalf, rightHalf)}`;
};

/**
* @param {!CanvasRenderingContext2D} context
* @param {string} text
* @param {number} maxWidth
* @param {function(string, number):string} trimFunction
* @return {string}
*/
const trimText = (context, text, maxWidth, trimFunction) => {
  const maxLength = 200;
  if (maxWidth <= 10) return '';
  if (text.length > maxLength) text = trimFunction(text, maxLength);
  // const textWidth = UI.measureTextWidth(context, text);
  const textWidth = context.measureText(text).width;
  if (textWidth <= maxWidth) return text;

  let l = 0;
  let r = text.length;
  let lv = 0;
  let rv = textWidth;
  while (l < r && lv !== rv && lv !== maxWidth) {
    const m = Math.ceil(l + (r - l) * (maxWidth - lv) / (rv - lv));
    const mv = context.measureText(trimFunction(text, m)).width;
    // const mv = UI.measureTextWidth(context, trimFunction(text, m));
    if (mv <= maxWidth) {
      l = m;
      lv = mv;
    } else {
      r = m - 1;
      rv = mv;
    }
  }
  text = trimFunction(text, l);
  return text !== '\u2026' ? text : '';
};

/**
* @param {!CanvasRenderingContext2D} context
* @param {string} text
* @param {number} maxWidth
* @return {string}
*/
const trimTextMiddle = (context, text, maxWidth) =>
  trimText(context, text, maxWidth, (text, width) => trimMiddle(text, width));

export default trimTextMiddle;
