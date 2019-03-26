import React from 'react';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { Form, setupForm, teardownForm } from '../Form';
import {
  connect,
  dispatch,
  regSaga,
  regHandlers,
  selectWaiting,
} from '../../../store';
import { fetchTeams, fetchUser } from '../../../apis/core';
import { fetchAttributeDefinitions } from '../../../apis/core/attributeDefinitions';

const fields = ({ attributeDefinitions, locales, teams, timezones }) => [
  {
    name: 'spaceAdmin',
    label: 'Space Admin',
    type: 'checkbox',
    required: true,
  },
  {
    name: 'enabled',
    label: 'Enabled',
    type: 'checkbox',
    required: true,
  },
  {
    name: 'displayName',
    label: 'Display Name',
    type: 'text',
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    required: true,
  },
  {
    name: 'preferredLocale',
    label: 'Preferred Locale',
    type: 'select',
    options: locales.map(locale => ({
      value: locale.code,
      label: locale.name,
    })),
    required: false,
  },
  {
    name: 'timezone',
    label: 'Timezone',
    type: 'select',
    options: timezones.map(timezone => ({
      value: timezone.id,
      label: timezone.name,
    })),
    required: false,
  },
  {
    name: 'attributesMap',
    label: 'Attributes',
    type: 'attributes',
    required: false,
    attributeDefinitions,
  },
  {
    name: 'memberships',
    label: 'Teams',
    type: 'memberships',
    required: false,
    teams,
  },
];

const values = ({ attributeDefinitions, space, user }) => ({
  spaceAdmin: user ? user.spaceAdmin : false,
  enabled: user ? user.enabled : true,
  displayName: user ? user.displayName : '',
  email: user ? user.email : '',
  preferredLocale: user ? user.preferredLocale : '',
  timezone: user ? user.timezone : '',
  attributesMap: user
    ? user.attributesMap
    : attributeDefinitions.reduce(
        (value, { name }) => ({ ...value, [name]: [] }),
        {},
      ),
  memberships: user
    ? user.memberships.map(membership => ({
        team: { name: membership.team.name },
      }))
    : [],
});

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
    const [{ user }, { attributeDefinitions }, { teams }] = yield all([
      call(fetchUser, { username, include: 'attributesMap,memberships' }),
      call(fetchAttributeDefinitions, {
        attributeType: 'userAttributeDefinitions',
      }),
      call(fetchTeams),
    ]);
    yield put({ type: 'USER_FORM/SET_USER', payload: { formKey, user } });
    yield put({
      type: 'USER_FORM/SET_ATTRIBUTE_DEFINITIONS',
      payload: { formKey, attributeDefinitions },
    });
    yield put({
      type: 'USER_FORM/SET_TEAMS',
      payload: { formKey, teams },
    });
    const space = yield selectWaiting(state => state.getIn(['meta', 'space']));
    yield call(setupForm, {
      formKey,
      values: values({ attributeDefinitions, space, teams, user }),
    });
  }),
);

regHandlers({
  'USER_FORM/SET_USER': (state, action) =>
    state.setIn(['forms', action.payload.formKey, 'user'], action.payload.user),
  'USER_FORM/SET_ATTRIBUTE_DEFINITIONS': (state, action) =>
    state.setIn(
      ['forms', action.payload.formKey, 'attributeDefinitions'],
      action.payload.attributeDefinitions,
    ),
  'USER_FORM/SET_TEAMS': (state, action) =>
    state.setIn(
      ['forms', action.payload.formKey, 'teams'],
      action.payload.teams,
    ),
});

const mapStateToProps = (state, props) => ({
  locales: state.getIn(['meta', 'locales'], null),
  space: state.getIn(['meta', 'space'], null),
  teams: state.getIn(['forms', props.formKey, 'teams'], null),
  timezones: state.getIn(['meta', 'timezones'], null),
  user: state.getIn(['forms', props.formKey, 'user'], null),
  attributeDefinitions: state.getIn(
    ['forms', props.formKey, 'attributeDefinitions'],
    null,
  ),
});

export const UserForm = connect(mapStateToProps)(
  props =>
    props.locales &&
    props.space &&
    props.teams &&
    props.timezones &&
    props.user &&
    props.attributeDefinitions && (
      <Form
        formKey={props.formKey}
        fields={fields(props)}
        onSubmit={props.onSubmit}
      />
    ),
);

UserForm.setup = setup;
UserForm.teardown = teardown;
