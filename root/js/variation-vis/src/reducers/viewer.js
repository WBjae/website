const initialState = {
  scale: 1,
  translate: 0,
  _scaleX: 1,  // internal state, use scale instead unless absolutely necessary
  _translateX: 0,  // internal state, use translate instead unless absolutely necessary
  isZoomPanOccuring: false
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
    default:
      return state
  }
}

export default viewer;
