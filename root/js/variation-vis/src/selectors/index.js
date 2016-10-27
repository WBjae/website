export const getFullWidth = (state) => {
  return state.viewer.referenceSequenceLength * 10;
};

export const getSVGxMin = (state) => {
  const {translate, scale} = state.viewer;
  return translate * -1 / scale;
}

export const getSVGxMax = (state) => {
  const {translate, scale} = state.viewer;
  const fullWidth = getFullWidth(state);
  return (fullWidth - translate) / scale;
}
