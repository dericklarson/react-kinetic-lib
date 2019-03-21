import { call, takeEvery } from 'redux-saga/effects';
import { dispatch, regHandlers, regSaga } from '../store';
import { fetchLocales, fetchTimezones } from '../apis/core/meta';
import { fetchSpace } from '../apis/core';

regSaga(
  takeEvery('FETCH_SPACE', function*() {
    const data = yield call(fetchSpace, { include: 'attributesMap,details' });
    dispatch('SET_SPACE', data.space);
  }),
);

regSaga(
  takeEvery('FETCH_LOCALES', function*() {
    const response = yield call(fetchLocales);
    dispatch('SET_LOCALES', response.data.locales);
  }),
);

regSaga(
  takeEvery('FETCH_TIMEZONES', function*() {
    const response = yield call(fetchTimezones);
    dispatch('SET_TIMEZONES', response.data.timezones);
  }),
);

regHandlers({
  SET_LOCALES: (state, action) =>
    state.setIn(['meta', 'locales'], action.payload),
  SET_SPACE: (state, action) => state.setIn(['meta', 'space'], action.payload),
  SET_TIMEZONES: (state, action) =>
    state.setIn(['meta', 'timezones'], action.payload),
});
