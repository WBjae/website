const initialState = {
  scale: 1,
  translate: 0,
  isZoomPanOccuring: false
}

const viewer = (state = initialState, action) => {
  switch (action.type) {
    case 'START_TRANSFORM':
      return {
        ...state,
        isZoomPanOccuring: true
      }
    case 'END_TRANSFORM':
      return {
        ...state,
        translate: action.transform.translateX,
        scale: action.transform.scaleX,
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
