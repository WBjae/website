export const setDetail = (segmentId, detail) => ({
  type: 'SET_DETAIL',
  id: segmentId,
  detail: detail
});

export const cancelDetail = () => ({
  type: 'CANCEL_DETAIL',
});
