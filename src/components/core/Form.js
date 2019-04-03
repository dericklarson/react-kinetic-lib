import React from 'react';
import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import { fromJS, hasIn, is, List, Map, OrderedMap } from 'immutable';
import { connect, dispatch, regHandlers, regSaga } from '../../store';
import { AttributesField } from './AttributesField';
import { MembershipsField } from './MembershipsField';
import { TextMultiField } from './TextMultiField';

export const getTimestamp = () => Math.floor(new Date().getTime() / 1000);
const identity = it => it;

export const isEmpty = value =>
  value === null ||
  value === undefined ||
  (value.hasOwnProperty('length') && value.length === 0);

export const equals = (a, b) => is(fromJS(a), fromJS(b));

const convertDataSource = ([fn, args = [], options = {}]) =>
  fromJS({
    fn,
    argsFn: typeof args === 'function' ? args : () => args,
    options,
  });

const initializeFieldState = field =>
  Map(field).merge({
    dirty: false,
    focused: false,
    touched: false,
    errors: List([]),
    custom: Map({}),
  });

regHandlers({
  SETUP_FORM: (
    state,
    { payload: { formKey, dataSources, fields, initialValues } },
  ) =>
    state.setIn(
      ['forms', formKey],
      Map({
        dataSources: Map(dataSources).map(convertDataSource),
        fieldsFn: fields,
        initialValuesFn: initialValues,
        state: Map(),
      }),
    ),
  SETUP_FIELDS: (state, { payload: { formKey, fields, initialValues } }) =>
    state.setIn(
      ['forms', formKey, 'fields'],
      OrderedMap(
        List(fields)
          .map(initializeFieldState)
          .map(field => [field.get('name'), field]),
      ).map((field, name) => {
        const initialValue = name.startsWith('attributesMap.')
          ? field.get('type').endsWith('-multi')
            ? initialValues['attributesMap'][name.replace('attributesMap.', '')]
            : initialValues['attributesMap'][
                name.replace('attributesMap.', '')
              ][0]
          : initialValues[name];
        return field.merge({
          initialValue,
          value: initialValue,
        });
      }),
    ),
  SET_VALUE: (state, { payload: { formKey, name, value } }) =>
    state.updateIn(['forms', formKey, 'fields', name], field =>
      field.merge({
        value,
        touched: true,
        dirty: !equals(value, field.get('initialValue')),
      }),
    ),
  SET_FIELD_CUSTOM: (state, { payload: { formKey, name, path, value } }) =>
    state.setIn(['forms', formKey, 'fields', name, 'custom', ...path], value),
  FOCUS_FIELD: (state, { payload: { formKey, field } }) =>
    state.setIn(['forms', formKey, 'fields', field, 'focused'], true),
  BLUR_FIELD: (state, { payload: { formKey, field } }) =>
    state
      .setIn(['forms', formKey, 'fields', field, 'focused'], false)
      .setIn(['forms', formKey, 'fields', field, 'touched'], true),
  TEARDOWN_FORM: (state, action) =>
    state.deleteIn(['forms', action.payload.formKey]),
  VALIDATE: (state, { payload: { formKey } }) =>
    state.updateIn(['forms', formKey, 'fields'], fields =>
      fields.map(field =>
        field.set(
          'errors',
          field.get('required') && isEmpty(field.get('value'))
            ? List(['is required'])
            : List(),
        ),
      ),
    ),
  CALL_DATA_SOURCE: (state, { payload: { formKey, name, args } }) =>
    state.setIn(['forms', formKey, 'dataSources', name, 'args'], args),
  RESOLVE_DATA_SOURCE: (
    state,
    { payload: { formKey, shared, name, data, timestamp, args } },
  ) => {
    const updateShared = shared
      ? state.setIn(['dataSources', name], Map({ data, timestamp, args }))
      : state;
    return updateShared.mergeIn(['forms', formKey, 'dataSources', name], {
      data,
      args,
    });
  },
});

regSaga(
  takeEvery('SETUP_FORM', function*({ payload }) {
    const { formKey } = payload;
    const dataSources = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources']),
    );

    // To kick things off we want to evaluate data sources with no dependencies.
    // The values for these initial evaluates will also not be available.
    const values = {};
    yield all(
      dataSources
        .filter(ds => isEmpty(ds.getIn(['options', 'dependencies'])))
        .keySeq()
        .map(name =>
          put({
            type: 'CHECK_DATA_SOURCE',
            payload: { formKey, name, values },
          }),
        )
        .toArray(),
    );
  }),
);

regSaga(
  takeEvery('CHECK_DATA_SOURCE', function*({ payload }) {
    const { formKey, name, values } = payload;
    const { args: prevArgs, argsFn, options } = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources', name]).toObject(),
    );
    const dataSources = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources']),
    );
    const dependencies = dataSources
      .filter((ds, name) => hasIn(options, ['dependencies', name]))
      .map(ds => ds.get('data'))
      .toJS();

    const args = argsFn({ ...dependencies, values });
    if (!equals(args, prevArgs)) {
      const data = yield select(state =>
        state.getIn(['dataSources', name, 'data']),
      );
      const timestamp = yield select(state =>
        state.getIn(['dataSources', name, 'timestamp']),
      );
      if (options.get('shared') && data) {
        yield put({
          type: 'RESOLVE_DATA_SOURCE',
          payload: { formKey, name, data, args },
        });
      } else {
        yield put({
          type: 'CALL_DATA_SOURCE',
          payload: { formKey, name, args },
        });
      }
    }
  }),
);

regSaga(
  takeEvery('CALL_DATA_SOURCE', function*({ payload }) {
    const { formKey, name, args } = payload;
    const { fn, options } = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources', name]).toObject(),
    );
    const shared = options.get('shared');
    const transform = options.get('transform', identity);
    const data = transform(yield call(fn, ...args));
    const timestamp = yield call(getTimestamp);
    yield put({
      type: 'RESOLVE_DATA_SOURCE',
      payload: { formKey, name, shared, data, timestamp },
    });
  }),
);

regSaga(
  takeEvery('RESOLVE_DATA_SOURCE', function*({ payload }) {
    const { formKey, name } = payload;
    const dataSources = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources']),
    );
    yield all(
      dataSources
        .filter(ds => ds.getIn(['options', 'dependencies'], []).includes(name))
        .keySeq()
        .map(name =>
          put({
            type: 'CHECK_DATA_SOURCE',
            payload: { formKey, name, values: {} },
          }),
        )
        .toArray(),
    );
    if (dataSources.every(ds => ds.has('data'))) {
      const dependencies = dataSources.map(ds => ds.get('data')).toJS();
      const fieldsFn = yield select(state =>
        state.getIn(['forms', formKey, 'fieldsFn']),
      );
      const initialValuesFn = yield select(state =>
        state.getIn(['forms', formKey, 'initialValuesFn']),
      );
      const fields = fieldsFn({ ...dependencies });
      const initialValues = initialValuesFn({ ...dependencies });
      yield put({
        type: 'SETUP_FIELDS',
        payload: { formKey, fields, initialValues },
      });
    }
  }),
);

regSaga(
  takeEvery('REJECT_DATA_SOURCE', function*({ payload }) {
    console.error('REJECT_DATA_SOURCE', payload);
  }),
);

export const setupForm = payload => {
  dispatch('SETUP_FORM', payload);
};

export const teardownForm = ({ formKey }) => {
  dispatch('TEARDOWN_FORM', { formKey });
};

export const onFocus = ({ formKey, field }) => () => {
  dispatch('FOCUS_FIELD', { formKey, field });
};

export const onBlur = ({ formKey, field }) => () => {
  dispatch('BLUR_FIELD', { formKey, field });
};

export const onChange = ({ formKey }) => event => {
  if (event.target.type === 'checkbox') {
    dispatch('SET_VALUE', {
      formKey,
      name: event.target.name,
      value: event.target.checked,
    });
  } else if (
    event.target.type === 'attributes' ||
    event.target.type === 'memberships'
  ) {
    dispatch('SET_VALUE', {
      formKey,
      name: event.target.name,
      value: event.target.value,
    });
  } else {
    dispatch('SET_VALUE', {
      formKey,
      name: event.target.name,
      value: event.target.value,
    });
  }
  dispatch('VALIDATE', { formKey });
};

export const onSubmit = (onSubmit, values) => event => {
  event.preventDefault();
  onSubmit(values);
};

export const setFieldCustom = ({ formKey, name }) => (path, value) => {
  dispatch('SET_FIELD_CUSTOM', { formKey, name, path, value });
};

export const mapStateToProps = (state, props) =>
  state.getIn(['forms', props.formKey], Map()).toObject();

export const SelectField = props => (
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

export const TextField = props => (
  <div className="field">
    <label htmlFor={props.id || props.name}>{props.label}</label>
    <input
      type="text"
      id={props.id || props.name}
      name={props.name}
      value={props.value || ''}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.onFocus}
    />
  </div>
);

export const CheckboxField = props => (
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

export const Field = props => {
  switch (props.type) {
    case 'select':
      return <SelectField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    case 'attributes':
      return <AttributesField {...props} />;
    case 'memberships':
      return <MembershipsField {...props} />;
    case 'text-multi':
      return <TextMultiField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

export const Form = connect(mapStateToProps)(props => (
  <form onSubmit={onSubmit(props.onSubmit, props.values)}>
    {props.fields &&
      props.fields.toList().map(field => (
        <Field
          key={field.get('name')}
          name={field.get('name')}
          id={field.get('id')}
          label={field.get('label')}
          options={field.get('options')}
          attributeDefinitions={field.get('attributeDefinitions')}
          teams={field.get('teams')}
          type={field.get('type')}
          value={field.get('value')}
          onFocus={onFocus({
            formKey: props.formKey,
            field: field.get('name'),
          })}
          onBlur={onBlur({ formKey: props.formKey, field: field.get('name') })}
          onChange={onChange({ formKey: props.formKey })}
          dirty={field.get('dirty')}
          valid={field.get('valid')}
          focused={field.get('focused')}
          touched={field.get('touched')}
          errors={field.get('errors')}
          custom={field.get('custom')}
          setCustom={setFieldCustom({
            formKey: props.formKey,
            name: field.get('name'),
          })}
          component={props.components[field.get('name')]}
        />
      ))}
    <button type="submit">Submit</button>
  </form>
));
