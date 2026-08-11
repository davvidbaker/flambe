export type IncrementDirection = 1 | -1;

// Returns the next index, wrapping around either end of the collection.
function circularIncrement(
  direction: IncrementDirection,
  currentIndex: number,
  arrayLength: number,
): number {
  return currentIndex + direction < 0
    ? arrayLength - 1
    : (currentIndex + direction) % arrayLength;
}

export default circularIncrement;
