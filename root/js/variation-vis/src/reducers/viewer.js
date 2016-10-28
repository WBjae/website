const initialState = {
  scale: 1,
  translate: 0,
  _scaleX: 1,  // internal state, use scale instead unless absolutely necessary
  _translateX: 0,  // internal state, use translate instead unless absolutely necessary
  isZoomPanOccuring: false,
  referenceSequenceLength: null,
  viewWidth: 500,
}

const viewer = (state = initialState, action) => {
  const fullWidth = getFullWidth(state);
  const center = computeSVGxCenter(state._translateX, state._scaleX, getFullWidth(state));
  const xMin = computeSVGxMin(state._translateX, state._scaleX, getFullWidth(state));
  const xMax = computeSVGxMax(state._translateX, state._scaleX, getFullWidth(state));
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
    case 'UPDATE_VIEW_WIDTH':
      return {
        ...state,
        viewWidth: action.width
      }
    case 'REQUEST_RESET':
      return {
        ...state,
        ..._getTransform(state, 0.9, fullWidth / 2)
      }
    case 'REQUEST_PAN':
      const translateDelta = (xMax - xMin) * action.panBy;
      return {
        ...state,
        ..._getTransform(state, state._scaleX, center + translateDelta)
      }
      case 'REQUEST_PAN_TO':
        return {
          ...state,
          ..._getTransform(state, state._scaleX, action.panCenter)
        }
    case 'REQUEST_ZOOM':
      const scaleTo = action.zoomBy * state._scaleX;
      return {
        ...state,
        ..._getTransform(state, scaleTo, center)
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
    // scale: scaleX,
    // translate: t
  }
}

export const getFullWidth = (state) => {
  return state.referenceSequenceLength * 10;
};

export const computeSVGxMin = (translate, scale) => {
  return translate * -1 / scale;
}

export const computeSVGxMax = (translate, scale, fullWidth) => {
  return (fullWidth - translate) / scale
}

export const computeSVGxCenter = (translate, scale, fullWidth) => {
  return (computeSVGxMin(translate, scale) +
    computeSVGxMax(translate, scale, fullWidth)) / 2;
}


export default viewer;
