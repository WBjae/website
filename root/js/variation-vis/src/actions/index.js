
// reference sequence update
export const updateRefseq = (length) => ({
  type: 'UPDATE_REFSEQ',
  length: length
})
// zoom and pan
export const startTransform = () => ({
  type: 'START_TRANSFORM'
});

export const updateTransform = (transform) => ({
  type: 'UPDATE_TRANSFORM',
  transform: transform
})

export const endTransform = () => ({
  type: 'END_TRANSFORM',
});
