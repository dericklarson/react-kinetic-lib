import React from 'react';

export const SelectField = props =>
  props.visible && (
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
