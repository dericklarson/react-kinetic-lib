import React from 'react';
import { Form } from '../../form/Form';
import {
  createFormType,
  updateFormType,
  fetchFormType,
} from '../../../apis';

const dataSources = ({ kappSlug, name }) => ({
  formType: [
    fetchFormType,
    [{ kappSlug, name, include: 'details' }],
    {
      transform: result => result.formType,
      runIf: () => !!name,
    },
  ],
});

const handleSubmit = ({ kappSlug, name }) => values =>
  (name ? updateFormType : createFormType)({
    formType: values.toJS(),
    kappSlug,
    name,
  }).then(({ formType, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the form type';
    }
    return formType;
  });

const fields = () => [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    helpText: 'This descriptive name is often used incunjunction with Bundle Workflow',
    required: true,
    initialValue: ({ formType }) => (formType ? formType.get('name') : ''),
  },
];

export const FormTypeForm = ({
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
