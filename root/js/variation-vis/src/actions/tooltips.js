export const addTooltip = (segmentId, content, segmentRegion, position) => ({
  type: 'ADD_TOOLTIP',
  id: segmentId,
  segmentRegion: segmentRegion,
  content: content,
  position: position
});

export const replaceTooltip = (segmentId, content, segmentRegion, position) => ({
  type: 'REPLACE_TOOLTIP',
  id: segmentId,
  segmentRegion: segmentRegion,
  content: content,
  position: position
});

export const removeTooltip = (segmentId) => ({
  type: 'REMOVE_TOOLTIP',
  id: segmentId
});
