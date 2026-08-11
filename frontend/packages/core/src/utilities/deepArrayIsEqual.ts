// for arrays to use isEqual
/** 💁 does not handle arrays of arrays */

import isEqual from 'lodash/isEqual';

export default function deepArrayIsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!isEqual(a[i], b[i])) {
      return false;
    }
  }

  return true;
}
