const tooltips = (state = {}, action) => {
  const {id, content, position, segmentRegion} = action;  
  switch (action.type) {
    case 'ADD_TOOLTIP':
      return {
        ...state,
        [action.id]: {
          id,
          content,
          position,
          segmentRegion,
        }
      };
    case 'REPLACE_TOOLTIP':
      return {
        [action.id]: {
          id,
          content,
          position,
          segmentRegion,
        }
      };
    case 'REMOVE_TOOLTIP':
      const {[action.id]: omit, ...rest} = state;
      return rest;
    default:
      return state;
  }
}

export default tooltips;
