import React from 'react';
import { get, getIn, List, Map } from 'immutable';
import { connect, dispatch, regHandlers } from '../../store';

const isEmpty = value =>
  value === null ||
  value === undefined ||
  (value.hasOwnProperty('length') && value.length === 0);

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
      .setIn(['forms', formKey, 'errors'], Map(values).map(() => List())),
  SET_VALUE: (state, { payload: { formKey, field, value } }) =>
    console.log('SET_VALUE', value) ||
    state
      .setIn(['forms', formKey, 'values', field], value)
      .setIn(
        ['forms', formKey, 'fieldStates', field, 'dirty'],
        value !== state.getIn(['forms', formKey, 'initialValues', field]),
      ),
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

export const onFocus = ({ formKey }) => event => {
  dispatch('FOCUS_FIELD', {
    formKey,
    field: event.target.name,
  });
};

export const onBlur = ({ formKey }) => event => {
  dispatch('BLUR_FIELD', {
    formKey,
    field: event.target.name,
  });
};

export const onChange = ({ fields, formKey }) => event => {
  if (event.target.type === 'checkbox') {
    dispatch('SET_VALUE', {
      formKey,
      field: event.target.name,
      value: event.target.checked,
    });
  } else {
    dispatch('SET_VALUE', {
      formKey,
      field: event.target.name,
      value: event.target.value,
    });
  }
  dispatch('VALIDATE', { fields, formKey });
};

export const onSubmit = (onSubmit, values) => event => {
  event.preventDefault();
  onSubmit(values);
};

export const mapStateToProps = (state, props) => ({
  values: state.getIn(['forms', props.formKey, 'values']),
  fieldStates: state.getIn(['forms', props.formKey, 'fieldStates']),
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
    default:
      return <TextField {...props} />;
  }
};

export const Form = connect(mapStateToProps)(props => (
  <form onSubmit={onSubmit(props.onSubmit, props.values)}>
    {props.fields.map(field => (
      <Field
        key={field.name}
        name={field.name}
        id={field.id}
        label={field.label}
        options={field.options}
        type={field.type}
        value={get(props.values, field.name)}
        onFocus={onFocus({ formKey: props.formKey })}
        onBlur={onBlur({ formKey: props.formKey })}
        onChange={onChange({ fields: props.fields, formKey: props.formKey })}
        dirty={getIn(props.fieldStates, [field.name, 'dirty'])}
        valid={getIn(props.fieldStates, [field.name, 'valid'])}
        focused={getIn(props.fieldStates, [field.name, 'focused'])}
        touched={getIn(props.fieldStates, [field.name, 'touched'])}
        errors={get(props.errors, field.name)}
      />
    ))}
    <button type="submit">Submit</button>
  </form>
));
