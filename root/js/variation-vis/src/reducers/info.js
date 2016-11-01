
const info = (state = null, action) => {
  switch (action.type) {
    case 'SET_DETAIL':
      return action.detail
    case 'CANCEL_DETAIL':
      return null
    default:
      return state
  }
}

export default info;
