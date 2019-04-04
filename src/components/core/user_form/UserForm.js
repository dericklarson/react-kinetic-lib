import React, { Component } from 'react';
import { Form, setupForm, teardownForm } from '../Form';
import { fetchSpace, fetchTeams, fetchUser } from '../../../apis/core';
import { fetchLocales, fetchTimezones } from '../../../apis/core/meta';
import { fetchAttributeDefinitions } from '../../../apis/core/attributeDefinitions';

const secondThing = user => {
  console.log('>>> second thing >>>', user);
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('<<< second thing <<<', user);
      resolve(2);
    });
  });
};

const dataSources = ({ user, username }) => ({
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
    { transform: result => result.user },
  ],
  attributeDefinitions: [
    fetchAttributeDefinitions,
    [{ attributeType: 'userAttributeDefinitions' }],
    { transform: result => result.attributeDefinitions },
  ],
  teams: [fetchTeams, [], { transform: result => result.teams }],
  secondThing: [secondThing, ({ user }) => [user], { dependencies: ['user'] }],
});

const fields = ({ attributeFields }) => ({
  attributeDefinitions,
  locales,
  teams,
  timezones,
}) => [
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
      value: locale.get('code'),
      label: locale.get('name'),
    })),
    required: false,
  },
  {
    name: 'timezone',
    label: 'Timezone',
    type: 'select',
    options: timezones.map(timezone => ({
      value: timezone.get('id'),
      label: timezone.get('name'),
    })),
    required: false,
  },
  ...(attributeFields
    ? Object.entries(attributeFields).map(([name, config]) => ({
        name: `attributesMap.${name}`,
        label: config.label || name,
        type: attributeDefinitions
          .find(attrDef => attrDef.get('name') === name)
          .get('allowsMultiple')
          ? 'text-multi'
          : 'text',
        required: false,
        component: config.component,
      }))
    : [
        {
          name: 'attributesMap',
          label: 'Attributes',
          type: 'attributes',
          required: false,
          attributeDefinitions,
        },
      ]),
  {
    name: 'memberships',
    label: 'Teams',
    type: 'memberships',
    required: false,
    teams,
  },
];

const initialValues = ({ attributeDefinitions, space, user }) => ({
  spaceAdmin: user ? user.get('spaceAdmin') : false,
  enabled: user ? user.get('enabled') : true,
  displayName: user ? user.get('displayName') : '',
  email: user ? user.get('email') : '',
  preferredLocale: user ? user.get('preferredLocale') : '',
  timezone: user ? user.get('timezone') : '',
  attributesMap: user
    ? user.get('attributesMap')
    : attributeDefinitions.reduce(
        (value, { name }) => ({ ...value, [name]: [] }),
        {},
      ),
  memberships: user ? user.get('memberships') : [],
});

const setup = ({ formKey, username, attributeFields }) => {
  setupForm({
    formKey,
    dataSources: dataSources({ username }),
    fields: fields({ attributeFields }),
    initialValues,
  });
};

const teardown = ({ formKey }) => {
  teardownForm({ formKey });
};

export class UserForm extends Component {
  componentDidMount() {
    const { auto, components, onSubmit, ...setupProps } = this.props;
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
        onSubmit={this.props.onSubmit}
        components={this.props.components || {}}
      />
    );
  }
}

UserForm.setup = setup;
UserForm.teardown = teardown;
