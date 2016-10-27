const initialState = {
  scale: 1,
  translate: 0,
  _scaleX: 1,  // internal state, use scale instead unless absolutely necessary
  _translateX: 0,  // internal state, use translate instead unless absolutely necessary
  isZoomPanOccuring: false,
  referenceSequenceLength: null,
}

const viewer = (state = initialState, action) => {
  switch (action.type) {
    case 'START_TRANSFORM':
      return {
        ...state,
        isZoomPanOccuring: true
      }
    case 'UPDATE_TRANSFORM':
      return {
        ...state,
        _translateX: action.transform.translateX,
        _scaleX: action.transform.scaleX,
      }
    case 'END_TRANSFORM':
      return {
        ...state,
        translate:  state._translateX,
        scale: state._scaleX,
        isZoomPanOccuring: false
      }
    case 'UPDATE_REFSEQ':
      return {
        ...state,
        referenceSequenceLength: action.length
      }
    case 'REQUEST_RESET':
      return {
        ...state,
        ..._getTransform(state, 0.9, getFullWidth(state) / 2)
      }
    case 'REQUEST_PAN':
      const translate = (getSVGxMax(state) - getSVGxMin(state)) * action.panBy;
      return {
        ...state,
        ..._getTransform(state, state._scaleX, getSVGxCenter(state) + translate)
      }
    case 'REQUEST_ZOOM':
      const scaleTo = action.zoomBy * state._scaleX;
      return {
        ...state,
        ..._getTransform(state, scaleTo, getSVGxCenter(state))
      }
    default:
      return state
  }
}

const _getTransform = (state, scaleX, centerX) => {
  // transform point x such that it occupies centerPosition
  // k * x + t = centerPosition
  const originalCenterX = getFullWidth(state) / 2;
  const t = originalCenterX - (scaleX * centerX);
  return {
    _scaleX: scaleX,
    _translateX: t,
    scale: scaleX,
    translate: t
  }
}

export const getFullWidth = (state) => {
  return state.referenceSequenceLength * 10;
};

export const getSVGxMin = (state) => {
  const {translate, scale} = state;
  return translate * -1 / scale;
}

export const getSVGxMax = (state) => {
  const {translate, scale} = state;
  const fullWidth = getFullWidth(state);
  return (fullWidth - translate) / scale;
}

export const getSVGxCenter = (state) => {
  return (getSVGxMax(state) + getSVGxMin(state)) / 2;
}

export default viewer;
