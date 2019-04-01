import React from 'react';
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
  ...(attributeFields
    ? Object.entries(attributeFields).map(([name, config]) => ({
        name: `attributesMap.${name}`,
        label: config.label || name,
        type: attributeDefinitions.find(({ name: defName }) => defName === name)
          .allowsMultiple
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

const mapStateToProps = (state, props) => ({});

export const UserForm = props => (
  <Form
    formKey={props.formKey}
    onSubmit={props.onSubmit}
    components={props.components || {}}
  />
);

UserForm.setup = setup;
UserForm.teardown = teardown;
