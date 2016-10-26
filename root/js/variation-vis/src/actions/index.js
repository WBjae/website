
// reference sequence update
export const updateRefseq = (length) => ({
  type: 'UPDATE_REFSEQ',
  length: length
})
// zoom and pan
export const startTransform = () => ({
  type: 'START_TRANSFORM'
});

export const endTransform = (transform) => ({
  type: 'END_TRANSFORM',
  transform: transform
});
