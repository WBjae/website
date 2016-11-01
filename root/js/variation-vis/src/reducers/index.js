import { combineReducers } from 'redux';
import viewer from './viewer';
import tooltips from './tooltips';
import info from './info';

const rootReducer = combineReducers({
  viewer,
  tooltips,
  info
})

export default rootReducer
