import { createStore, applyMiddleware } from 'redux';
import rootReducer from './reducers';

const logger = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  return result
};

const store = process.env.NODE_ENV === 'development' ?
  createStore(rootReducer, applyMiddleware(logger)) : createStore(rootReducer);

export default store;
