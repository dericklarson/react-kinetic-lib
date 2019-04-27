import React from 'react';
import { fromJS, get } from 'immutable';

const onSelectChange = setCustom => event => {
  setCustom(['select'], event.target.value);
};

const add = (name, value, onChange, setCustom) => team => () => {
  onChange({
    target: {
      name,
      type: 'memberships',
      value: value.push(fromJS({ team: { name: team } })),
    },
  });
  setCustom(['select'], '');
};

const remove = (name, value, onChange) => team => () => {
  onChange({
    target: {
      name,
      type: 'memberships',
      value: value.filter(
        membership => membership.getIn(['team', 'name']) !== team,
      ),
    },
  });
};

export const TeamsField = props => (
  <div className="field">
    Teams
    <table>
      <tbody>
        {props.selectedTeams.map(team => (
          <tr key={team.get('name')}>
            <td>{team.get('name')}</td>
            <td>
              <button
                type="button"
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                onClick={props.remove(team.get('name'))}
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
              {props.unselectedTeams.map(team => (
                <option key={team.get('name')} value={team.get('name')}>
                  {team.get('name')}
                </option>
              ))}
            </select>
          </td>
          <td>
            <button
              type="button"
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              disabled={!props.selectValue}
              onClick={props.add(props.selectValue)}
            >
              +
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const generateTeamsFieldProps = props => ({
  ...props,
  selectedTeams: props.options
    .filter(team =>
      props.value.find(
        membership => membership.getIn(['team', 'name']) === team.get('name'),
      ),
    )
    .sortBy(team => team.get('name')),
  unselectedTeams: props.options
    .filter(
      team =>
        !props.value.find(
          membership => membership.getIn(['team', 'name']) === team.get('name'),
        ),
    )
    .sortBy(team => team.get('name')),
  selectValue: get(props.custom, 'select', ''),
  selectChange: onSelectChange(props.setCustom),
  add: add(props.name, props.value, props.onChange, props.setCustom),
  remove: remove(props.name, props.value, props.onChange),
});
