// @flow
import curry from 'lodash/fp/curry';

// returns an index
function circularIncrement(
  direction: 1 | -1,
  currentIndex: number,
  arrayLength: number,
) {
  return currentIndex + direction < 0
    ? arrayLength - 1
    : (currentIndex + direction) % arrayLength;
}

export default circularIncrement;