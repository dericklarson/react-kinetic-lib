import React from 'react';

export const TeamsRolesField = ({ options, value, add, remove }) =>
  options
    .map(team =>
      team.merge(
        value.some(m => m.getIn(['team', 'name']) === team.get('name'))
          ? { checked: true, onChange: remove(team.get('name')) }
          : { checked: false, onChange: add(team.get('name')) },
      ),
    )
    .groupBy(team =>
      team.get('name').startsWith('Role::') ? 'Roles' : 'Teams',
    )
    .sortBy((value, key) => key)
    .map((teams, type) => (
      <div key={type}>
        {type}
        {teams.map(team => (
          <div key={team.get('name')}>
            <label>
              <input
                type="checkbox"
                checked={team.get('checked')}
                onChange={team.get('onChange')}
              />
              {team.get('name')}
            </label>
          </div>
        ))}
      </div>
    ))
    .toList();
