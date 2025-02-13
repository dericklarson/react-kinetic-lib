import { List, Map } from 'immutable';
import isarray from 'isarray';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { dispatch, regHandlers, regSaga } from '../../store';

export const hasData = data => isarray(data) || data instanceof List;

export const isClientSide = tableData => {
  const data = tableData.get('data');
  const dataSource = tableData.get('dataSource');

  return (
    hasData(data) &&
    ((dataSource && dataSource.clientSideSearch === true) || !dataSource)
  );
};

const clientSideNextPage = tableData =>
  tableData.update(
    'pageOffset',
    pageOffset => pageOffset + tableData.get('pageSize'),
  );

const clientSidePrevPage = tableData =>
  tableData.update('pageOffset', pageOffset =>
    Math.max(0, pageOffset - tableData.get('pageSize')),
  );

const serverSideNextPage = tableData =>
  tableData
    .set('loading', true)
    .set('nextPageToken', tableData.get('currentPageToken'))
    .update('pageTokens', pt => pt.push(tableData.get('currentPageToken')));

const serverSidePrevPage = tableData =>
  tableData
    .set('loading', true)
    .update('pageTokens', pt => pt.pop())
    .update(t => t.set('nextPageToken', t.get('pageTokens').last()));

export const generateFilters = (tableKey, columns) =>
  Map(
    columns
      .filter(c => c.get('filterable'))
      .reduce(
        (filters, column) =>
          filters.set(
            column.get('value'),
            Map({
              value: '',
              column: column.get('value'),
              title: column.get('title'),
              onChange: value => {
                dispatch('SET_FILTER', {
                  tableKey,
                  filter: column.get('value'),
                  value,
                });
              },
            }),
          ),

        Map(),
      ),
  );

export const generateInitialSortColumn = (sortColumn, columns) =>
  sortColumn ? columns.find(col => col.get('value') === sortColumn) : null;

regHandlers({
  MOUNT_TABLE: (state, { payload: { tableKey } }) => {
    return state.setIn(['tables', tableKey, 'mounted'], true);
  },
  UNMOUNT_TABLE: (state, { payload: { tableKey } }) => {
    return state.deleteIn(['tables', tableKey]);
  },
  CONFIGURE_TABLE: (
    state,
    {
      payload: {
        tableKey,
        data,
        dataSource,
        columns,
        pageSize = 25,
        defaultSortColumn = null,
        defaultSortDirection = 'desc',
      },
    },
  ) =>
    !state.getIn(['tables', tableKey, 'mounted'])
      ? state
      : state.hasIn(['tables', tableKey, 'configured'])
      ? state.setIn(['tables', tableKey, 'initialize'], false)
      : state.mergeIn(
          ['tables', tableKey],
          Map({
            data: hasData(data) ? List(data) : data,
            dataSource,
            columns,
            rows: List(),

            initializing: true,
            loading: true,

            pageSize,
            sortColumn: generateInitialSortColumn(defaultSortColumn, columns),
            sortDirection: defaultSortDirection,

            // Pagination
            currentPageToken: null,
            nextPageToken: null,
            pageTokens: List(),
            pageOffset: 0,

            // Filtering
            filters: generateFilters(tableKey, columns),
            appliedFilters: generateFilters(tableKey, columns),

            configured: true,
            initialize: true,
          }),
        ),
  SET_ROWS: (state, { payload: { tableKey, rows, data, nextPageToken } }) =>
    state.updateIn(['tables', tableKey], table =>
      table
        .set('rows', rows)
        .set('data', data)
        .set('currentPageToken', nextPageToken)
        .set('nextPageToken', null)
        .set('initializing', false)
        .set('loading', false),
    ),
  NEXT_PAGE: (state, { payload: { tableKey } }) =>
    state.updateIn(['tables', tableKey], tableData =>
      isClientSide(tableData)
        ? clientSideNextPage(tableData)
        : serverSideNextPage(tableData),
    ),
  PREV_PAGE: (state, { payload: { tableKey } }) =>
    state.updateIn(['tables', tableKey], tableData =>
      isClientSide(tableData)
        ? clientSidePrevPage(tableData)
        : serverSidePrevPage(tableData),
    ),
  SORT_COLUMN: (state, { payload: { tableKey, column } }) =>
    state.updateIn(['tables', tableKey], t => {
      const sortColumn = t.get('sortColumn');
      const sortDirection = t.get('sortDirection');
      return (
        t
          // When sorting changes, reset pagination.
          .set('pageOffset', 0)
          // Update the sort column / direction.
          .set(
            'sortDirection',
            sortColumn === column
              ? sortDirection === 'desc'
                ? 'asc'
                : 'desc'
              : 'desc',
          )
          .set('sortColumn', column)
      );
    }),
  SET_FILTER: (state, { payload: { tableKey, filter, value } }) =>
    state.setIn(['tables', tableKey, 'filters', filter, 'value'], value),
  APPLY_FILTERS: (state, { payload: { tableKey } }) =>
    state.setIn(
      ['tables', tableKey, 'appliedFilters'],
      state.getIn(['tables', tableKey, 'filters']),
    ),
  REFECTH_TABLE_DATA: (state, { payload: { tableKey } }) =>
    state.updateIn(['tables', tableKey], tableData =>
      tableData.get('dataSource') ? tableData.set('data', null) : tableData,
    ),
});

function* calculateRowsTask({ payload }) {
  const { tableKey } = payload;
  const tableData = yield select(state => state.getIn(['tables', tableKey]));

  const { rows, data, nextPageToken } = yield call(calculateRows, tableData);
  yield put({
    type: 'SET_ROWS',
    payload: { tableKey, rows, data, nextPageToken },
  });
}

regSaga(takeEvery('CONFIGURE_TABLE', calculateRowsTask));
regSaga(takeEvery('NEXT_PAGE', calculateRowsTask));
regSaga(takeEvery('PREV_PAGE', calculateRowsTask));
regSaga(takeEvery('SORT_COLUMN', calculateRowsTask));
regSaga(takeEvery('SORT_DIRECTION', calculateRowsTask));
regSaga(takeEvery('APPLY_FILTERS', calculateRowsTask));
regSaga(takeEvery('REFECTH_TABLE_DATA', calculateRowsTask));

const generateSortParams = tableData =>
  tableData.get('sortColumn')
    ? {
        orderBy: tableData.getIn(['sortColumn', 'value']),
        direction: tableData.get('sortDirection'),
      }
    : {};

export const clientSideRowFilter = filters => row => {
  const usableFilters = filters
    .filter(filter => filter.get('value') !== '')
    .map((filter, column) => filter.set('currentValue', row[column]));

  return usableFilters.size === 0
    ? true
    : usableFilters.reduce((has, filter) => {
        const value = filter.get('value');
        const currentValue = filter.get('currentValue');

        return value && typeof value === 'string' && value !== ''
          ? currentValue
              .toLocaleLowerCase()
              .startsWith(value.toLocaleLowerCase())
          : has;
      }, false);
};

const applyClientSideFilters = (tableData, data) => {
  const pageOffset = tableData.get('pageOffset');
  const pageSize = tableData.get('pageSize');
  const sortColumn = tableData.get('sortColumn');
  const sortDirection = tableData.get('sortDirection');
  const filters = tableData.get('appliedFilters');
  const startIndex = pageOffset;
  const endIndex = Math.min(pageOffset + pageSize, data.size);

  return data
    .update(d => d.filter(clientSideRowFilter(filters)))
    .update(d => (sortColumn ? d.sortBy(r => r[sortColumn.get('value')]) : d))
    .update(d => (sortDirection === 'asc' ? d.reverse() : d))
    .update(d => d.slice(startIndex, endIndex));
};

const calculateRows = tableData => {
  const dataSource = tableData.get('dataSource');
  const data = tableData.get('data');

  if (isClientSide(tableData)) {
    const rows = applyClientSideFilters(tableData, data);

    return Promise.resolve({ rows, data });
  } else if (dataSource) {
    const transform = dataSource.transform || (result => result);
    const params = dataSource.clientSideSearch
      ? dataSource.params(tableData.toJS())
      : {
          ...dataSource.params(tableData.toJS()),
          ...generateSortParams(tableData),
          pageToken: tableData.get('nextPageToken'),
        };

    return dataSource
      .fn(params)
      .then(transform)
      .then(({ nextPageToken, data }) => ({
        nextPageToken,
        data: List(data),
        rows: List(data),
      }))
      .then(result => {
        if (dataSource.clientSideSearch) {
          return {
            ...result,
            rows: applyClientSideFilters(tableData, result.rows),
          };
        }
        return result;
      });
  } else {
    throw new Error(
      'Unable to calculate rows: Missing both data and a dataSource!',
    );
  }
};

export const mountTable = tableKey => dispatch('MOUNT_TABLE', { tableKey });
export const unmountTable = tableKey => dispatch('UNMOUNT_TABLE', { tableKey });
export const configureTable = payload => dispatch('CONFIGURE_TABLE', payload);
export const refetchTable = tableKey =>
  dispatch('REFECTH_TABLE_DATA', { tableKey });
