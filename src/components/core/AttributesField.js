import { get, List, setIn } from 'immutable';
import React from 'react';

const onSelectChange = setCustom => event => {
  setCustom(['select'], event.target.value);
};

const onEditInputChange = (name, value, onChange) => (
  attrName,
  index,
) => event => {
  onChange({
    target: {
      type: 'attributes',
      name,
      value: setIn(value, [attrName, index], event.target.value),
    },
  });
};

const onNewInputChange = setCustom => event => {
  setCustom(['input'], event.target.value);
};

const remove = (name, value, onChange) => (attrName, index) => () => {
  onChange({
    target: {
      type: 'attributes',
      name,
      value: value.deleteIn([attrName, index]),
    },
  });
};

const add = (name, value, onChange, setCustom, attrName, attrValue) => () => {
  onChange({
    target: {
      type: 'attributes',
      name,
      value: value.update(attrName, List(), values => values.push(attrValue)),
    },
  });
  setCustom(['select'], '');
  setCustom(['input'], '');
};

const AttributesFieldsDefault = props => (
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
        {props.value
          .entrySeq()
          .sortBy(([name]) => name)
          .flatMap(([name, values]) =>
            values.map((value, index) => ({ name, value, index })),
          )
          .map(({ name, value, index }) => (
            <tr key={`${name}-${index}`}>
              <td>{name}</td>
              <td>
                <input
                  type="text"
                  value={value}
                  onFocus={props.onFocus}
                  onBlur={props.onBlur}
                  onChange={props.editInputChange(name, index)}
                />
              </td>
              <td>
                <button
                  type="button"
                  onFocus={props.onFocus}
                  onBlur={props.onBlur}
                  onClick={props.remove(name, index)}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        <tr>
          <td>
            <select
              value={props.selectValue}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              onChange={props.selectChange}
            >
              <option />
              {props.selectableAttributes.map(name => (
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
              onChange={props.newInputChange}
              value={props.newInputValue}
            />
          </td>
          <td>
            <button
              type="button"
              disabled={!props.selectValue || !props.newInputValue}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              onClick={props.add}
            >
              +
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const AttributesField = ({
  component: AttributesFieldsImpl = AttributesFieldsDefault,
  ...props
}) => (
  <AttributesFieldsImpl
    {...props}
    editInputChange={onEditInputChange(props.name, props.value, props.onChange)}
    newInputChange={onNewInputChange(props.setCustom)}
    newInputValue={props.custom.get('input', '')}
    selectChange={onSelectChange(props.setCustom)}
    selectValue={props.custom.get('select', '')}
    selectableAttributes={props.options
      .filter(
        attrDef =>
          attrDef.get('allowsMultiple') ||
          get(props.value, attrDef.get('name'), List()).isEmpty(),
      )
      .map(attrDef => attrDef.get('name'))}
    add={add(
      props.name,
      props.value,
      props.onChange,
      props.setCustom,
      props.custom.get('select'),
      props.custom.get('input'),
    )}
    remove={remove(props.name, props.value, props.onChange)}
  />
);
