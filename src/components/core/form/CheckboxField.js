import React from 'react';

export const CheckboxField = props =>
  props.visible && (
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
