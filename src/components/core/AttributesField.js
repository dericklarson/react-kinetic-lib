import { fromJS, get, Map, setIn } from 'immutable';
import React from 'react';
import { isEmpty } from './Form';

const onSelectChange = (setState, name) => event => {
  setState([name, 'select'], event.target.value);
};

const onEditInputChange = (name, value, onChange, attrName, index) => event => {
  onChange({
    target: {
      type: 'attributes',
      name,
      value: setIn(value, [attrName, index], event.target.value),
    },
  });
};

const onNewInputChange = (setState, name) => event => {
  setState([name, 'input'], event.target.value);
};

const remove = (name, value, onChange, onBlur, attrName, index) => () => {
  onChange({
    target: {
      type: 'attributes',
      name,
      value: fromJS(value)
        .deleteIn([attrName, index])
        .toJS(),
    },
  });
  onBlur();
};

const add = (name, value, onChange, setState, attrName, attrValue) => () => {
  onChange({
    target: {
      type: 'attributes',
      name,
      value: {
        ...value,
        [attrName]: [...value[attrName], attrValue],
      },
    },
  });
  setState([name, 'select'], '');
  setState([name, 'input'], '');
};

export const AttributesField = props => {
  if (props.value) {
    const configuredAttributes = Map(props.value)
      .entrySeq()
      .sortBy(([name]) => name)
      .flatMap(([name, values]) =>
        values.map((value, index) => ({ name, value, index })),
      );
    const selectValue = get(props.state, 'select', '');
    const inputValue = get(props.state, 'input', '');
    const selectableAttributes = props.attributeDefinitions
      .filter(
        ({ allowsMultiple, name }) =>
          allowsMultiple || !props.value || isEmpty(props.value[name]),
      )
      .map(({ name }) => name);
    return (
      <div className="field">
        {props.label}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {configuredAttributes.map(({ name, value, index }) => (
              <tr key={`${name}-${index}`}>
                <td>{name}</td>
                <td>
                  <input
                    type="text"
                    value={value}
                    onFocus={props.onFocus}
                    onBlur={props.onBlur}
                    onChange={onEditInputChange(
                      props.name,
                      props.value,
                      props.onChange,
                      name,
                      index,
                    )}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onFocus={props.onFocus}
                    onBlur={props.onBlur}
                    onClick={remove(
                      props.name,
                      props.value,
                      props.onChange,
                      props.onBlur,
                      name,
                      index,
                    )}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <select
                  value={selectValue}
                  onFocus={props.onFocus}
                  onBlur={props.onBlur}
                  onChange={onSelectChange(props.setState, props.name)}
                >
                  <option />
                  {selectableAttributes.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  onFocus={props.onFocus}
                  onBlur={props.onBlur}
                  onChange={onNewInputChange(props.setState, props.name)}
                  value={inputValue}
                />
              </td>
              <td>
                <button
                  type="button"
                  disabled={!selectValue || !inputValue}
                  onFocus={props.onFocus}
                  onBlur={props.onBlur}
                  onClick={add(
                    props.name,
                    props.value,
                    props.onChange,
                    props.setState,
                    selectValue,
                    inputValue,
                  )}
                >
                  +
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else {
    return null;
  }
};
