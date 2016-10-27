
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

export const requestZoom = (zoomBy) => ({
  type: 'REQUEST_ZOOM',
  zoomBy: zoomBy
});

export const requestPan = (panBy) => ({
  type: 'REQUEST_PAN',
  panBy: panBy
});

export const requestReset = () => ({
  type: 'REQUEST_RESET'
});
