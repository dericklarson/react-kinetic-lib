import { createContext } from 'react';
import { applyMiddleware, compose, createStore } from 'redux';
import { create as createAxiosInstance } from 'axios';
import { connect as originalConnect } from 'react-redux';
import { select, take } from 'redux-saga/effects';
import { Map, setIn } from 'immutable';
import { reducer, regHandlers } from './reducer';
import { commitSagas, regSaga, runSaga, sagaMiddleware } from './saga';

export const config = {};

export const configure = getAuthToken => {
  config.getAuthToken = getAuthToken;
};

export const axios = createAxiosInstance();
axios.interceptors.request.use(request => {
  if (config.getAuthToken) {
    request.headers.Authorization = `Bearer ${config.getAuthToken()}`;
  }
  return request;
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'react-kinetic-lib' })
  : compose;

const store = createStore(
  reducer,
  Map(),
  composeEnhancers(applyMiddleware(sagaMiddleware)),
);

const dispatch = (type, payload) => store.dispatch({ type, payload });
const dispatcher = type => payload => store.dispatch({ type, payload });
const action = (type, payload) => ({ type, payload });

const commitStore = () => {
  commitSagas();
};

const context = createContext();

const connect = (...args) =>
  originalConnect(...setIn(args, [3, 'context'], context));

export {
  action,
  context,
  commitStore,
  connect,
  dispatch,
  dispatcher,
  reducer,
  regHandlers,
  regSaga,
  runSaga,
  store,
};

export const selectWaiting = function*(selector) {
  while (true) {
    const value = yield select(selector);
    if (value) {
      return value;
    } else {
      yield take();
    }
  }
};
