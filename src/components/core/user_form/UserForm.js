import React from 'react';
import { call, put, takeEvery } from 'redux-saga/effects';
import { Form, setupForm, teardownForm } from '../Form';
import { connect, dispatch, regSaga, regHandlers } from '../../../store';
import { fetchUser } from '../../../apis/core';

const fields = ({ locales, space, timezones, user }) => [
  {
    name: 'spaceAdmin',
    label: 'Space Admin',
    type: 'checkbox',
    defaultValue: user ? user.spaceAdmin : false,
  },
  {
    name: 'enabled',
    label: 'Enabled',
    type: 'checkbox',
    defaultValue: user ? user.enabled : true,
  },
  {
    name: 'displayName',
    label: 'Display Name',
    type: 'text',
    defaultValue: user ? user.displayName : '',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    defaultValue: user ? user.email : '',
  },
  {
    name: 'preferredLocale',
    label: 'Preferred Locale',
    type: 'select',
    options: locales.map(locale => ({
      value: locale.code,
      label: locale.name,
    })),
    defaultValue: user ? user.preferredLocale : space.defaultLocale,
  },
  {
    name: 'timezone',
    label: 'Timezone',
    type: 'select',
    options: timezones.map(timezone => ({
      value: timezone.id,
      label: timezone.name,
    })),
    defaultValue: user ? user.timezone : space.defaultTimezone,
  },
];

const setup = ({ formKey, username, user }) => {
  dispatch('FETCH_SPACE');
  dispatch('FETCH_LOCALES');
  dispatch('FETCH_TIMEZONES');
  if (username) {
    dispatch('USER_FORM/EDIT_USER', { formKey, username });
  }
};

const teardown = ({ formKey }) => {
  teardownForm({ formKey });
};

regSaga(
  takeEvery('USER_FORM/EDIT_USER', function*(action) {
    const { username, formKey } = action.payload;
    const { user } = yield call(fetchUser, { username, include: 'attributes' });
    yield put({ type: 'USER_FORM/SET_USER', payload: { formKey, user } });
    yield call(setupForm, { formKey });
  }),
);

regHandlers({
  'USER_FORM/SET_USER': (state, action) =>
    state.setIn(['forms', action.payload.formKey, 'user'], action.payload.user),
});

const mapStateToProps = (state, props) => ({
  locales: state.getIn(['meta', 'locales'], null),
  space: state.getIn(['meta', 'space'], null),
  timezones: state.getIn(['meta', 'timezones'], null),
  user: state.getIn(['forms', props.formKey, 'user'], null),
});

export const UserForm = connect(mapStateToProps)(
  props =>
    props.locales &&
    props.space &&
    props.timezones &&
    props.user && (
      <Form
        formKey={props.formKey}
        fields={fields(props)}
        onSubmit={props.onSubmit}
      />
    ),
);

UserForm.setup = setup;
UserForm.teardown = teardown;
