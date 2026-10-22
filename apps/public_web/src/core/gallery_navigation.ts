export function stepGalleryIndex(
  currentIndex: number,
  itemCount: number,
  direction: -1 | 1
) {
  if (itemCount <= 0) {
    return -1;
  }
  return (currentIndex + direction + itemCount) % itemCount;
}
