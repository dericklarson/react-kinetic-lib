import React from 'react';
import t from 'prop-types';
import {
  createCategory,
  fetchAttributeDefinitions,
  fetchCategory,
  updateCategory,
} from '../../../apis';
import { Form } from '../../form/Form';
import { slugify } from '../../../helpers';

const dataSources = ({ kappSlug, categorySlug }) => ({
  category: [
    fetchCategory,
    [{ kappSlug, categorySlug, include: 'attributesMap' }],
    {
      transform: result => result.category,
      runIf: () => !!categorySlug,
    },
  ],
  attributeDefinitions: [
    fetchAttributeDefinitions,
    [{ kappSlug, attributeType: 'categoryAttributeDefinitions' }],
    { transform: result => result.attributeDefinitions },
  ],
});

const handleSubmit = ({ kappSlug, categorySlug }) => values =>
  (categorySlug ? updateCategory : createCategory)({
    category: values.toJS(),
    kappSlug,
    categorySlug,
  }).then(({ category, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the category';
    }
    return category;
  });

const fields = ({ kappSlug, categorySlug }) => [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    helpText: 'Displayed Name for Category',
    required: true,
    initialValue: ({ category }) => (category ? category.get('name') : ''),
    onChange: ({ values }, { setValue }) => {
      if (values.get('linked')) {
        setValue('slug', slugify(values.get('name')), false);
      }
    },
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    helpText: 'Unique Identifier for the Category',
    required: false,
    initialValue: ({ category }) => (category ? category.get('slug') : ''),
    onChange: (_bindings, { setValue }) => {
      setValue('linked', false);
    },
  },
  {
    name: 'linked',
    label: 'Linked',
    type: 'checkbox',
    transient: true,
    initialValue: ({ category }) => !category,
    visible: false,
  },
  {
    name: 'attributesMap',
    label: 'Attributes',
    type: 'attributes',
    required: false,
    options: ({ attributeDefinitions }) => attributeDefinitions,
    initialValue: ({ category }) =>
      category ? category.get('attributesMap') : null,
  },
];

export const CategoryForm = ({
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

CategoryForm.propTypes = {
  /** The Slug of the kapp the category exists in, or should be created in */
  kappSlug: t.string.isRequired,
  /** The slug of the category being edited. Leave blank if creating a new category */
  categorySlug: t.string,
};
