import React from 'react';
import { get, Map } from 'immutable';
import { connect, dispatch, regHandlers } from '../../store';

regHandlers({
  SETUP_FORM: (state, action) =>
    state.setIn(
      ['forms', action.payload.formKey, 'values'],
      Map(action.payload.values),
    ),
  SET_VALUE: (state, action) =>
    state.setIn(
      ['forms', action.payload.formKey, 'values', action.payload.field],
      action.payload.value,
    ),
  TEARDOWN_FORM: (state, action) =>
    state.deleteIn(['forms', action.payload.formKey]),
});

export const setupForm = ({ formKey, values }) => {
  dispatch('SETUP_FORM', { formKey, values });
};

export const teardownForm = ({ formKey }) => {
  dispatch('TEARDOWN_FORM', { formKey });
};

export const onChange = formKey => event => {
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
};

export const onSubmit = (onSubmit, values) => event => {
  event.preventDefault();
  onSubmit(values);
};

export const mapStateToProps = (state, props) => ({
  values: state.getIn(['forms', props.formKey, 'values']),
});

export const SelectField = props => (
  <div className="field">
    <label htmlFor={props.id || props.name}>{props.label}</label>
    <select
      id={props.id || props.name}
      value={props.value}
      onChange={props.onChange}
    >
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
      value={props.value}
      onChange={props.onChange}
    />
  </div>
);

export const CheckboxField = props => (
  <div className="field">
    <input
      type="checkbox"
      id={props.id || props.name}
      name={props.name}
      checked={props.value}
      onChange={props.onChange}
    />
    <label htmlFor={props.id || props.name}>{props.label}</label>
  </div>
);

export const Field = props => {
  switch (props.renderType) {
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
        renderType={field.renderType}
        value={get(props.values, field.name, field.defaultValue)}
        onChange={onChange(props.formKey)}
      />
    ))}
    <button type="submit">Submit</button>
  </form>
));
