import React, { Component } from 'react';
import { Form, setupForm, teardownForm } from '../Form';
import { fetchSpace, fetchTeams, fetchUser } from '../../../apis/core';
import { fetchLocales, fetchTimezones } from '../../../apis/core/meta';
import { fetchAttributeDefinitions } from '../../../apis/core/attributeDefinitions';
import { createUser, updateUser } from '../../../apis/core/users';
import { get, getIn } from 'immutable';

const dataSources = ({ username }) => ({
  space: [
    fetchSpace,
    [{ include: 'attributesMap' }],
    { shared: true, cache: 3600, transform: result => result.space },
  ],
  locales: [
    fetchLocales,
    [],
    { shared: true, cache: true, transform: result => result.data.locales },
  ],
  timezones: [
    fetchTimezones,
    [],
    { shared: true, cache: true, transform: result => result.data.timezones },
  ],
  user: [
    fetchUser,
    [{ username, include: 'attributesMap,memberships' }],
    { transform: result => result.user, runIf: () => !!username },
  ],
  attributeDefinitions: [
    fetchAttributeDefinitions,
    [{ attributeType: 'userAttributeDefinitions' }],
    { transform: result => result.attributeDefinitions },
  ],
  teams: [fetchTeams, [], { transform: result => result.teams }],
});

const handleSubmit = ({ username }) => values => {
  const user = values.toJS();
  return username ? updateUser({ username, user }) : createUser({ user });
};

const fields = ({ attributeFields, username }) => [
  !username && {
    name: 'username',
    label: 'Username',
    type: 'text',
    required: true,
  },
  {
    name: 'spaceAdmin',
    label: 'Space Admin',
    type: 'checkbox',
    initialValue: ({ user }) => get(user, 'spaceAdmin'),
  },
  {
    name: 'enabled',
    label: 'Enabled',
    type: 'checkbox',
    initialValue: ({ user }) => get(user, 'enabled'),
  },
  {
    name: 'displayName',
    label: 'Display Name',
    type: 'text',
    required: true,
    initialValue: ({ user }) => get(user, 'displayName'),
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    required: true,
    initialValue: ({ user }) => get(user, 'email', ''),
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: ({ values }) => values.get('changePassword'),
    visible: ({ values }) => values.get('changePassword'),
  },
  {
    name: 'passwordConfirmation',
    label: 'Password Confirmation',
    type: 'password',
    required: ({ values }) => values.get('changePassword'),
    visible: ({ values }) => values.get('changePassword'),
    constraint: ({ values }) =>
      values.get('passwordConfirmation') === values.get('password'),
    constraintMessage: 'Password Confirmation does not match',
  },
  {
    name: 'changePassword',
    label: 'Change Password',
    type: 'checkbox',
    visible: !!username,
    initialValue: !username,
    transient: true,
  },
  {
    name: 'preferredLocale',
    label: 'Preferred Locale',
    type: 'select',
    options: ({ locales }) =>
      locales.map(locale => ({
        value: locale.get('code'),
        label: locale.get('name'),
      })),
    initialValue: ({ user }) => get(user, 'preferredLocale'),
  },
  {
    name: 'timezone',
    label: 'Timezone',
    type: 'select',
    options: ({ timezones }) =>
      timezones.map(timezone => ({
        value: timezone.get('id'),
        label: timezone.get('name'),
      })),
    initialValue: ({ user }) => get(user, 'timezone'),
  },
  attributeFields
    ? Object.entries(attributeFields).map(([name, config]) => ({
        name: `attributesMap.${name}`,
        label: get(config, 'label', name),
        type: get(config, 'type', 'text'),
        required: get(config, 'required', false),
        initialValue: ({ user }) =>
          getIn(user, ['attributesMap', 'name'], config.initialValue),
      }))
    : {
        name: 'attributesMap',
        label: 'Attributes',
        type: 'attributes',
        required: false,
        options: ({ attributeDefinitions }) => attributeDefinitions,
        initialValue: ({ user }) => get(user, 'attributesMap'),
      },
  {
    name: 'memberships',
    label: 'Teams',
    type: 'memberships',
    required: false,
    options: ({ teams }) => teams,
    initialValue: ({ user }) => get(user, 'memberships'),
  },
];

const setup = ({
  formKey,
  handleSubmitSuccess,
  handleSubmitError,
  ...setupProps
}) => {
  setupForm({
    formKey,
    setupProps,
    dataSources,
    fields,
    handleSubmit,
    handleSubmitSuccess,
    handleSubmitError,
  });
};

const teardown = ({ formKey }) => {
  teardownForm({ formKey });
};

export class UserForm extends Component {
  componentDidMount() {
    const { auto, components, ...setupProps } = this.props;
    if (auto) {
      setup(setupProps);
    }
  }

  componentWillUnmount() {
    if (this.props.auto) {
      teardown({ formKey: this.props.formKey });
    }
  }

  render() {
    return (
      <Form
        formKey={this.props.formKey}
        components={this.props.components || {}}
      >
        {({ form, error, clearError }) => (
          <div>
            {error && (
              <div>
                There was an error <button onClick={clearError}>x</button>
              </div>
            )}

            {form || <div>LOADING!!!</div>}
          </div>
        )}
      </Form>
    );
  }
}

UserForm.setup = setup;
UserForm.teardown = teardown;
