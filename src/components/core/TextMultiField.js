import React from 'react';
import { get } from 'immutable';

const onInputChange = (name, setState) => event => {
  setState([name, 'input'], event.target.value);
};

const add = (name, values, onChange, value, setState) => () => {
  onChange({
    target: {
      name,
      type: 'text-multi',
      value: [...values, value],
    },
  });
  setState([name, 'input'], '');
};

const remove = (name, values, onChange, index) => () => {
  onChange({
    target: {
      name,
      type: 'text-multi',
      value: values.filter((v, i) => i !== index),
    },
  });
};

export const TextMultiField = props => {
  if (props.value) {
    const inputValue = get(props.state, 'input', '');
    return (
      <div className="field">
        {props.label}
        {props.value.map((v, i) => (
          <span key={i}>
            {v}
            <button
              type="button"
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              onClick={remove(props.name, props.value, props.onChange, i)}
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          onChange={onInputChange(props.name, props.setState)}
        />
        <button
          type="button"
          disabled={!inputValue}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          onClick={add(
            props.name,
            props.value,
            props.onChange,
            inputValue,
            props.setState,
          )}
        >
          +
        </button>
      </div>
    );
  } else {
    return null;
  }
};
