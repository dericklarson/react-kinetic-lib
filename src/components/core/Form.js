import React from 'react';
import { fromJS, get, getIn, is, List, Map } from 'immutable';
import { connect, dispatch, regHandlers } from '../../store';
import { AttributesField } from './AttributesField';
import { MembershipsField } from './MembershipsField';
import { TextMultiField } from './TextMultiField';

export const isEmpty = value =>
  value === null ||
  value === undefined ||
  (value.hasOwnProperty('length') && value.length === 0);

export const equals = (a, b) => is(fromJS(a), fromJS(b));

regHandlers({
  SETUP_FORM: (state, { payload: { formKey, values } }) =>
    state
      .setIn(['forms', formKey, 'initialValues'], Map(values))
      .setIn(['forms', formKey, 'values'], Map(values))
      .setIn(
        ['forms', formKey, 'fieldStates'],
        Map(values).map(() => ({
          dirty: false,
          touched: false,
          focused: false,
        })),
      )
      .setIn(['forms', formKey, 'errors'], Map(values).map(() => List()))
      .setIn(['forms', formKey, 'formState'], Map()),
  SET_VALUE: (state, { payload: { formKey, field, type, value } }) =>
    state
      .updateIn(['forms', formKey, 'values'], values =>
        setValue(field, type, value, values),
      )
      .setIn(
        ['forms', formKey, 'fieldStates', field, 'dirty'],
        !equals(
          value,
          getValue(
            field,
            type,
            state.getIn(['forms', formKey, 'initialValues']),
          ),
        ),
      )
      .setIn(['forms', formKey, 'fieldStates', field, 'touched'], true),
  SET_FORM_STATE: (state, { payload: { formKey, path, value } }) =>
    state.setIn(['forms', formKey, 'formState', ...path], value),
  FOCUS_FIELD: (state, { payload: { formKey, field } }) =>
    state.setIn(['forms', formKey, 'fieldStates', field, 'focused'], true),
  BLUR_FIELD: (state, { payload: { formKey, field } }) =>
    state
      .setIn(['forms', formKey, 'fieldStates', field, 'focused'], false)
      .setIn(['forms', formKey, 'fieldStates', field, 'touched'], true),
  TEARDOWN_FORM: (state, action) =>
    state.deleteIn(['forms', action.payload.formKey]),
  VALIDATE: (state, { payload: { formKey, fields } }) => {
    return state.setIn(
      ['forms', formKey, 'errors'],
      List(fields).reduce((errors, field) => {
        const value = state.getIn(['forms', formKey, 'values', field.name]);
        return errors.set(
          field.name,
          field.required && isEmpty(value) ? List(['is required']) : List(),
        );
      }, Map()),
    );
  },
});

export const setupForm = ({ formKey, values }) => {
  dispatch('SETUP_FORM', { formKey, values });
};

export const teardownForm = ({ formKey }) => {
  dispatch('TEARDOWN_FORM', { formKey });
};

export const onFocus = ({ formKey, field }) => () => {
  dispatch('FOCUS_FIELD', { formKey, field });
};

export const onBlur = ({ formKey, field }) => () => {
  dispatch('BLUR_FIELD', { formKey, field });
};

export const onChange = ({ fields, formKey }) => event => {
  if (event.target.type === 'checkbox') {
    dispatch('SET_VALUE', {
      formKey,
      field: event.target.name,
      type: event.target.type,
      value: event.target.checked,
    });
  } else if (
    event.target.type === 'attributes' ||
    event.target.type === 'memberships'
  ) {
    dispatch('SET_VALUE', {
      formKey,
      field: event.target.name,
      type: event.target.type,
      value: event.target.value,
    });
  } else {
    dispatch('SET_VALUE', {
      formKey,
      field: event.target.name,
      type: event.target.type,
      value: event.target.value,
    });
  }
  dispatch('VALIDATE', { fields, formKey });
};

export const onSubmit = (onSubmit, values) => event => {
  event.preventDefault();
  onSubmit(values);
};

export const setFormState = ({ formKey }) => (path, value) => {
  dispatch('SET_FORM_STATE', { formKey, path, value });
};

export const mapStateToProps = (state, props) => ({
  values: state.getIn(['forms', props.formKey, 'values']),
  fieldStates: state.getIn(['forms', props.formKey, 'fieldStates']),
  formState: state.getIn(['forms', props.formKey, 'formState']),
  errors: state.getIn(['forms', props.formKey, 'errors']),
});

export const SelectField = props => (
  <div className="field">
    <label htmlFor={props.id || props.name}>{props.label}</label>
    <select
      id={props.id || props.name}
      name={props.name}
      value={props.value || ''}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.onFocus}
    >
      <option />
      {props.options.map((option, i) => (
        <option key={i} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const TextField = props => (
  <div className="field">
    <label htmlFor={props.id || props.name}>{props.label}</label>
    <input
      type="text"
      id={props.id || props.name}
      name={props.name}
      value={props.value || ''}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.onFocus}
    />
  </div>
);

export const CheckboxField = props => (
  <div className="field">
    <input
      type="checkbox"
      id={props.id || props.name}
      name={props.name}
      checked={props.value || false}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.onFocus}
    />
    <label htmlFor={props.id || props.name}>{props.label}</label>
  </div>
);

export const Field = props => {
  switch (props.type) {
    case 'select':
      return <SelectField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    case 'attributes':
      return <AttributesField {...props} />;
    case 'memberships':
      return <MembershipsField {...props} />;
    case 'text-multi':
      return <TextMultiField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

export const setValue = (name, type, value, values) =>
  name.startsWith('attributesMap.')
    ? type.endsWith('-multi')
      ? values.setIn(
          ['attributesMap', name.replace('attributesMap.', '')],
          value,
        )
      : values.setIn(
          ['attributesMap', name.replace('attributesMap.', '')],
          [value],
        )
    : values.set(name, value);

export const getValue = (name, type, values) =>
  name.startsWith('attributesMap.')
    ? type.endsWith('-multi')
      ? values.getIn(['attributesMap', name.replace('attributesMap.', '')])
      : values.getIn(['attributesMap', name.replace('attributesMap.', ''), 0])
    : values.get(name);

export const Form = connect(mapStateToProps)(props => (
  <form onSubmit={onSubmit(props.onSubmit, props.values)}>
    {props.values &&
      props.fields.map(field => (
        <Field
          key={field.name}
          name={field.name}
          id={field.id}
          label={field.label}
          options={field.options}
          attributeDefinitions={field.attributeDefinitions}
          teams={field.teams}
          type={field.type}
          value={getValue(field.name, field.type, props.values)}
          onFocus={onFocus({ formKey: props.formKey, field: field.name })}
          onBlur={onBlur({ formKey: props.formKey, field: field.name })}
          onChange={onChange({ fields: props.fields, formKey: props.formKey })}
          dirty={getIn(props.fieldStates, [field.name, 'dirty'])}
          valid={getIn(props.fieldStates, [field.name, 'valid'])}
          focused={getIn(props.fieldStates, [field.name, 'focused'])}
          touched={getIn(props.fieldStates, [field.name, 'touched'])}
          errors={get(props.errors, field.name)}
          setState={setFormState({ formKey: props.formKey })}
          state={getIn(props.formState, [field.name])}
        />
      ))}
    <button type="submit">Submit</button>
  </form>
));
