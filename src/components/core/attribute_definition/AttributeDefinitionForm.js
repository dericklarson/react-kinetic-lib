import React from 'react';
import { Form } from '../../form/Form';
import t from 'prop-types';

import {
  createAttributeDefinition,
  updateAttributeDefinition,
  fetchAttributeDefinition,
} from '../../../apis';

const dataSources = ({ kappSlug, attributeType, attributeName }) => ({
  attributeDefinition: [
    fetchAttributeDefinition,
    [{ kappSlug, attributeType, attributeName, include: 'details' }],
    {
      transform: result => result.attributeDefinition,
      runIf: () => !!attributeName,
    },
  ],
});

const handleSubmit = ({ kappSlug, attributeType, attributeName }) => values =>
  (attributeName ? updateAttributeDefinition : createAttributeDefinition)({
    attributeDefinition: values.toJS(),
    kappSlug,
    attributeType,
    attributeName,
  }).then(({ attributeDefinition, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the attribute definition';
    }
    return attributeDefinition;
  });

const fields = () => [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    helpText: 'Unique Descriptive Name displayed when adding attributes',
    required: true,
    initialValue: ({ attributeDefinition }) =>
      attributeDefinition ? attributeDefinition.get('name') : '',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'text',
    helpText: 'Optional text describing use or function of the Attribute',
    required: false,
    initialValue: ({ attributeDefinition }) =>
      attributeDefinition ? attributeDefinition.get('description') : '',
  },
  {
    name: 'allowsMultiple',
    label: 'Allow multiple attributes?',
    type: 'checkbox',
    required: false,
    initialValue: ({ attributeDefinition }) =>
      attributeDefinition ? attributeDefinition.get('allowsMultiple') : false,
  },
];

/**
 * @component
 * A form for creating and updating Attribute Definitions within the Kinetic Platform
 */
export const AttributeDefinitionForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  ...formOptions
}) => (
  <Form
    addFields={addFields}
    alterFields={alterFields}
    fieldSet={fieldSet}
    formKey={formKey}
    components={components}
    onSubmit={handleSubmit(formOptions)}
    onSave={onSave}
    onError={onError}
    dataSources={dataSources(formOptions)}
    fields={fields(formOptions)}
  >
    {children}
  </Form>
);

// Specifies the default values for props:
AttributeDefinitionForm.defaultProps = {
  attributeName: null,
  kappSlug: null,
};

AttributeDefinitionForm.propTypes = {
  /** The type of attribute definition.   */
  attributeType: t.oneOf([
    'spaceAttributeDefinitions',
    'teamAttributeDefinitions',
    'userAttributeDefinitions',
    'userProfileAttributeDefinitions',
    'categoryAttributeDefinitions',
    'kappAttributeDefinitions',
    'formAttributeDefinitions',
    'datastoreFormAttributeDefinitions',
  ]).isRequired,
  /** The name of the attribute (assumes new if not null). */
  attributeName: t.string,
  /**
   * If the attribute definition is for a Kapp
   * (Kapp Attributes, Form Attributes, Category Attributes, ...etc)
   * a Kapp Slug is required.
   */
  kappSlug: t.string,
};
