import React from 'react';
import { Map } from 'immutable';
import { Table } from '../../table/Table';
import { fetchUsers } from '../../../apis';

const startsWith = (field, value) => `${field} =* "${value}"`;
const equals = (field, value) => `${field} = "${value}"`;
const STARTS_WITH_FIELDS = ['username', 'email', 'displayName'];

const userFilter = filters => {
  const q = Map(filters)
    .filter(filter => filter.value !== '')
    .map((filter, key) =>
      STARTS_WITH_FIELDS.includes(key)
        ? startsWith(key, filter.value)
        : equals(key, filter.value),
    )
    .toIndexedSeq()
    .toList()
    .join(' AND ');

  return q.length > 0 ? { q } : {};
};

const dataSource = {
  fn: fetchUsers,
  params: ({ pageSize, filters }) => ({
    include: 'details',
    limit: pageSize,
    ...userFilter(filters),
  }),
  transform: result => ({
    data: result.users,
    nextPageToken: result.nextPageToken,
  }),
};

const BooleanYesNoCell = props => <td>{props.value ? 'Yes' : 'No'}</td>;

const columns = [
  {
    value: 'username',
    title: 'Username',
    filterable: true,
    sortable: true,
  },
  {
    value: 'email',
    title: 'Email',
    filterable: true,
    sortable: true,
  },
  {
    value: 'displayName',
    title: 'Display Name',
    filterable: true,
    sortable: true,
  },
  {
    value: 'createdAt',
    title: 'Created At',
    filterable: true,
    sortable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    filterable: true,
    sortable: true,
  },
  {
    value: 'enabled',
    title: 'Enabled?',
    sortable: false,
    filterable: true,
    components: {
      BodyCell: BooleanYesNoCell,
    },
  },
  {
    value: 'spaceAdmin',
    title: 'Space Admin?',
    sortable: false,
    filterable: true,
    components: {
      BodyCell: BooleanYesNoCell,
    },
  },
];

export const UserTable = props => (
  <Table
    tableKey={props.tableKey}
    components={{
      ...props.components,
    }}
    dataSource={dataSource}
    columns={columns}
    addColumns={props.addColumns}
    alterColumns={props.alterColumns}
    columnSet={props.columnSet}
    pageSize={props.pageSize}
  >
    {props.children}
  </Table>
);

UserTable.STARTS_WITH_FIELDS = STARTS_WITH_FIELDS;
