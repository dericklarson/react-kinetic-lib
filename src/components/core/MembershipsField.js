import React from 'react';
import { get, List } from 'immutable';

const onSelectChange = (name, setState) => event => {
  setState([name, 'select'], event.target.value);
};

const add = (name, value, onChange, teamName, setState) => () => {
  onChange({
    target: {
      name,
      type: 'memberships',
      value: [...value, { team: { name: teamName } }],
    },
  });
  setState([name, 'select'], '');
};

const remove = (name, value, onChange, onBlur, team) => () => {
  onChange({
    target: {
      name,
      type: 'memberships',
      value: value.filter(membership => membership.team.name !== team),
    },
  });
  onBlur();
};

export const MembershipsField = props => {
  if (props.value) {
    const selectValue = get(props.state, 'select', '');
    const selectableTeams = props.teams
      .map(team => team.name)
      .filter(name => !props.value.find(mem => mem.team.name === name));
    return (
      <div className="field">
        {props.teams ? 'Teams' : 'Users'}
        <table>
          <tbody>
            {List(props.value)
              .sortBy(membership => membership.team.name)
              .map((membership, index) => (
                <tr key={index}>
                  <td>{membership.team.name}</td>
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
                        membership.team.name,
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
                  onChange={onSelectChange(props.name, props.setState)}
                >
                  <option />
                  {selectableTeams.map(team => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  type="button"
                  onFocus={props.onFocus}
                  onBlur={props.onBlur}
                  disabled={!selectValue}
                  onClick={add(
                    props.name,
                    props.value,
                    props.onChange,
                    selectValue,
                    props.setState,
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
