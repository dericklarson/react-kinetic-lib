import React from 'react';
import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import {
  fromJS,
  get,
  is,
  isImmutable,
  List,
  Map,
  OrderedMap,
  Set,
} from 'immutable';
import {
  action,
  connect,
  dispatch,
  regHandlers,
  regSaga,
} from '../../../store';
import { FieldConfigContext } from './FieldConfigContext';
import { generateAttributesFieldProps } from './AttributesField';

export const getTimestamp = () => Math.floor(new Date().getTime() / 1000);
const identity = it => it;

export const isEmpty = value =>
  value === null ||
  value === undefined ||
  value === '' ||
  (isImmutable(value) && value.isEmpty());

const convertDataSource = ([fn, args = [], options = {}]) =>
  fromJS({
    fn,
    argsFn: typeof args === 'function' ? args : () => args,
    options,
  });

export const initializeDataSources = dataSources =>
  resolveAncestorDependencies(Map(dataSources).map(convertDataSource));

const resolveAncestorDependencies = (
  dataSources,
  ancestorsMap = Map({ values: Set() }),
) => {
  const nextAncestorsMap = dataSources
    .map(dataSource => dataSource.getIn(['options', 'dependencies'], List()))
    .filter(deps => deps.every(dep => ancestorsMap.has(dep)))
    .reduce(
      (reduction, deps, name) =>
        reduction.set(
          name,
          deps.toSet().concat(deps.flatMap(dep => ancestorsMap.get(dep))),
        ),
      ancestorsMap,
    );

  if (dataSources.keySeq().every(name => ancestorsMap.has(name))) {
    return dataSources.map((dataSource, name) =>
      dataSource.setIn(
        ['options', 'ancestorDependencies'],
        ancestorsMap
          .get(name)
          .toList()
          .sort(),
      ),
    );
  } else {
    if (!nextAncestorsMap.equals(ancestorsMap)) {
      return resolveAncestorDependencies(dataSources, nextAncestorsMap);
    } else {
      throw 'Could not resolve dependency graph due to missing or cyclic dependencies';
    }
  }
};

const reinitializeFields = fields =>
  fields.map(field =>
    field.merge({
      initialValue: field.get('value'),
      dirty: false,
      touched: false,
    }),
  );

const defaultFieldProps = fromJS({
  enabled: true,
  options: [],
  required: false,
  visible: true,
  dirty: false,
  focused: false,
  touched: false,
  errors: [],
  custom: {},
});

const dynamicFieldProps = List([
  'enabled',
  'initialValue',
  'options',
  'required',
  'visible',
]);

const selectDataSourcesData = formKey => state =>
  state
    .getIn(['forms', formKey, 'dataSources'])
    .map(dataSource => dataSource.get('data'))
    .toObject();

const selectValues = formKey => state =>
  state.getIn(['forms', formKey, 'fields']).map(field => field.get('value'));

const selectBindings = formKey => state => ({
  ...selectDataSourcesData(formKey)(state),
  values: selectValues(formKey)(state),
});

const evaluateFieldProps = (props, bindings) => field =>
  props.reduce(
    (updatedField, prop) =>
      updatedField.hasIn(['functions', prop])
        ? updatedField.set(
            prop,
            fromJS(updatedField.getIn(['functions', prop])(bindings)),
          )
        : updatedField,
    field,
  );

const defaultMap = Map({
  attributes: Map(),
  memberships: List(),
  checkbox: false,
});

const defaultInitialValue = field =>
  field.get('initialValue') === null || field.get('initialValue') === undefined
    ? field.set('initialValue', defaultMap.get(field.get('type'), ''))
    : field;

const convertField = field =>
  dynamicFieldProps.reduce(
    (acc, prop) =>
      typeof field[prop] === 'function'
        ? acc.setIn(['functions', prop], field[prop]).set(prop, null)
        : acc,
    Map(defaultFieldProps).merge(field),
  );

export const checkRequired = field =>
  field.get('required') && isEmpty(field.get('value'))
    ? List([field.get('requiredMessage', 'This field is required')])
    : List();

export const checkPattern = field =>
  field.get('pattern') &&
  field.get('type') !== 'text' &&
  field.get('value') !== '' &&
  !field.get('value').match(field.get('pattern'))
    ? List([field.get('patternMessage', 'Invalid format')])
    : List();

export const checkConstraint = values => field =>
  field.get('constraint') && !field.get('constraint')({ values })
    ? List([field.get('constraintMessage', 'Invalid')])
    : List();

export const validateFields = fields =>
  fields.map(field =>
    field.set(
      'errors',
      List([
        checkRequired,
        checkPattern,
        checkConstraint(fields.map(f => f.get('value'))),
      ]).flatMap(fn => fn(field)),
    ),
  );

regHandlers({
  SETUP_FORM: (
    state,
    {
      payload: {
        formKey,
        setupProps,
        dataSources,
        fields,
        handleSubmit,
        handleSubmitSuccess,
        handleSubmitError,
      },
    },
  ) =>
    state.setIn(
      ['forms', formKey],
      Map({
        dataSources: initializeDataSources(dataSources(setupProps)),
        fields: OrderedMap(
          List(fields(setupProps))
            .flatten()
            .filter(f => !!f)
            .map(convertField)
            .map(field => [field.get('name'), field]),
        ),
        state: Map(),
        handleSubmit: handleSubmit(setupProps),
        handleSubmitSuccess,
        handleSubmitError,
        loaded: false,
        submitting: false,
        error: null,
      }),
    ),
  EVAL_INITIAL_VALUES: (state, { payload: { formKey } }) => {
    const bindings = selectDataSourcesData(formKey)(state);
    return state
      .updateIn(['forms', formKey, 'fields'], fields =>
        fields
          .map(evaluateFieldProps(['initialValue'], bindings))
          .map(defaultInitialValue)
          .map(field => field.set('value', field.get('initialValue'))),
      )
      .setIn(['forms', formKey, 'valuesInitialized'], true);
  },
  EVAL_FIELDS: (state, { payload: { formKey } }) => {
    const bindings = selectBindings(formKey)(state);
    return state
      .updateIn(['forms', formKey, 'fields'], fields =>
        fields.map(
          evaluateFieldProps(
            ['enabled', 'options', 'required', 'visible'],
            bindings,
          ),
        ),
      )
      .updateIn(['forms', formKey, 'fields'], validateFields)
      .setIn(['forms', formKey, 'loaded'], true);
  },
  SET_VALUE: (state, { payload: { formKey, name, value } }) =>
    state.updateIn(['forms', formKey, 'fields', name], field =>
      field.merge({
        value,
        touched: true,
        dirty: !is(value, field.get('initialValue')),
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
  CALL_DATA_SOURCE: (state, { payload: { formKey, name, args } }) =>
    state
      .mergeIn(['forms', formKey, 'dataSources', name], {
        args,
        resolved: false,
      })
      .deleteIn(['forms', formKey, 'dataSources', name, 'data']),
  IGNORE_DATA_SOURCE: (state, { payload: { formKey, name } }) =>
    state
      .mergeIn(['forms', formKey, 'dataSources', name], {
        args: null,
        resolved: true,
      })
      .deleteIn(['forms', formKey, 'dataSources', name, 'data']),
  RESOLVE_DATA_SOURCE: (
    state,
    { payload: { formKey, shared, name, data: nativeData, timestamp, args } },
  ) => {
    const data = fromJS(nativeData);
    const updateShared = shared
      ? state.setIn(['dataSources', name], Map({ data, timestamp, args }))
      : state;
    return updateShared.mergeIn(['forms', formKey, 'dataSources', name], {
      data,
      args,
      resolved: true,
    });
  },
  SUBMIT: (state, { payload: { formKey } }) =>
    state.setIn(['forms', formKey, 'submitting'], true),
  SUBMIT_SUCCESS: (state, { payload: { formKey } }) =>
    state
      .setIn(['forms', formKey, 'submitting'], false)
      .setIn(['forms', formKey, 'error'], null)
      .updateIn(['forms', formKey, 'fields'], reinitializeFields),
  SUBMIT_ERROR: (state, { payload: { formKey, error } }) =>
    state
      .setIn(['forms', formKey, 'submitting'], false)
      .setIn(['forms', formKey, 'error'], error),
  CLEAR_ERROR: (state, { payload: { formKey } }) =>
    state.setIn(['forms', formKey, 'error'], null),
  SUBMIT_FIELD_ERRORS: (state, { payload: { formKey, fieldNames } }) =>
    state
      .setIn(['forms', formKey, 'submitting'], false)
      .setIn(['forms', formKey, 'error'], 'There are invalid fields')
      .updateIn(['forms', formKey, 'fields'], fields =>
        fields.map(field =>
          fieldNames.includes(field.get('name'))
            ? field.set('touched', true)
            : field,
        ),
      ),
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
        .filter(ds => ds.getIn(['options', 'dependencies'], List()).isEmpty())
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
    const { formKey, name } = payload;
    const { args: prevArgs, argsFn, options } = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources', name]).toObject(),
    );
    const dataSources = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources']),
    );
    const values = yield select(state =>
      state.getIn(['forms', formKey, 'valuesInitialized'])
        ? state
            .getIn(['forms', formKey, 'fields'])
            .map(field => field.get('value'))
        : null,
    );
    const dependencies = dataSources
      .filter((ds, name) => options.get('dependencies', List()).contains(name))
      .map(ds => ds.get('data'))
      .toJS();

    const bindings = { ...dependencies, values };
    const runIfResult = !options.get('runIf') || options.get('runIf')(bindings);
    if (runIfResult) {
      const args = fromJS(argsFn(bindings));

      if (!args.equals(prevArgs)) {
        const data = yield select(state =>
          state.getIn(['dataSources', name, 'data']),
        );
        const timestamp = yield select(state =>
          state.getIn(['dataSources', name, 'timestamp']),
        );
        if (options.get('shared') && data) {
          yield put(
            action('RESOLVE_DATA_SOURCE', { formKey, name, data, args }),
          );
        } else {
          yield put(action('CALL_DATA_SOURCE', { formKey, name, args }));
        }
      }
    } else {
      yield put(action('IGNORE_DATA_SOURCE', { formKey, name }));
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
    const data = transform(yield call(fn, ...args.toJS()));
    const timestamp = yield call(getTimestamp);
    yield put({
      type: 'RESOLVE_DATA_SOURCE',
      payload: { formKey, name, shared, data, timestamp },
    });
  }),
);

const isResolved = dataSource => dataSource.get('resolved');
const dependsOn = (name, includeAncestors) => dataSource =>
  dataSource
    .getIn(
      ['options', includeAncestors ? 'ancestorDependencies' : 'dependencies'],
      List(),
    )
    .includes(name);

regSaga(
  takeEvery('RESOLVE_DATA_SOURCE', function*({ payload }) {
    const { formKey, name } = payload;
    const [dataSources, valuesInitialized] = yield select(state => [
      state.getIn(['forms', formKey, 'dataSources']),
      state.getIn(['forms', formKey, 'valuesInitialized']),
    ]);
    yield all(
      dataSources
        .filter(dependsOn(name))
        .keySeq()
        .map(name => put(action('CHECK_DATA_SOURCE', { formKey, name })))
        .toArray(),
    );
    if (
      dataSources.filterNot(dependsOn('values', true)).every(isResolved) &&
      !valuesInitialized
    ) {
      yield put(action('EVAL_INITIAL_VALUES', { formKey }));
    }
    if (dataSources.every(isResolved) && valuesInitialized) {
      yield put(action('EVAL_FIELDS', { formKey }));
    }
  }),
);

regSaga(
  takeEvery('EVAL_INITIAL_VALUES', function*({ payload: { formKey } }) {
    const dataSources = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources']),
    );
    const actions = dataSources
      .filter(dependsOn('values'))
      .keySeq()
      .map(name => put(action('CHECK_DATA_SOURCE', { formKey, name })));

    if (actions.isEmpty()) {
      yield put(action('EVAL_FIELDS', { formKey }));
    } else {
      yield all(actions.toArray());
    }
  }),
);

regSaga(
  takeEvery('SET_VALUE', function*({ payload: { formKey } }) {
    const dataSources = yield select(state =>
      state.getIn(['forms', formKey, 'dataSources']),
    );
    yield put(action('EVAL_FIELDS', { formKey }));
    yield all(
      dataSources
        .filter(dependsOn('values'))
        .keySeq()
        .map(name => put(action('CHECK_DATA_SOURCE', { formKey, name })))
        .toArray(),
    );
  }),
);

regSaga(
  takeEvery('REJECT_DATA_SOURCE', function*({ payload }) {
    console.error('REJECT_DATA_SOURCE', payload);
  }),
);

regSaga(
  takeEvery('SUBMIT', function*({ payload: { formKey } }) {
    const [
      handleSubmit,
      handleSubmitSuccess,
      handleSubmitError,
      values,
      errors,
    ] = yield select(state => [
      state.getIn(['forms', formKey, 'handleSubmit']),
      state.getIn(['forms', formKey, 'handleSubmitSuccess']),
      state.getIn(['forms', formKey, 'handleSubmitError']),
      state
        .getIn(['forms', formKey, 'fields'])
        .map(field => field.get('value')),
      state
        .getIn(['forms', formKey, 'fields'])
        .map(field => field.get('errors'))
        .filter(errors => !errors.isEmpty()),
    ]);

    if (errors.isEmpty()) {
      try {
        const result = yield call(handleSubmit, values);
        dispatch('SUBMIT_SUCCESS', { formKey });
        if (handleSubmitSuccess) yield call(handleSubmitSuccess, result);
      } catch (error) {
        dispatch('SUBMIT_ERROR', { formKey, error });
        if (handleSubmitError) yield call(handleSubmitError, error);
      }
    } else {
      dispatch('SUBMIT_FIELD_ERRORS', {
        formKey,
        fieldNames: errors.keySeq(),
      });
    }
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

export const onChange = ({ formKey, type, name }) => event => {
  if (type === 'checkbox') {
    dispatch('SET_VALUE', {
      formKey,
      name,
      value: event.target.checked,
    });
  } else {
    dispatch('SET_VALUE', {
      formKey,
      name,
      value: event.target.value,
    });
  }
};

export const onSubmit = formKey => event => {
  event.preventDefault();
  dispatch('SUBMIT', { formKey });
};

export const clearError = formKey => event => {
  dispatch('CLEAR_ERROR', { formKey });
};

export const setFieldCustom = ({ formKey, name }) => (path, value) => {
  dispatch('SET_FIELD_CUSTOM', { formKey, name, path, value });
};

export const mapStateToProps = (state, props) =>
  state.getIn(['forms', props.formKey], Map()).toObject();

const generateFieldProps = props =>
  props.type === 'attributes' ? generateAttributesFieldProps(props) : props;

export const Field = props => (
  <FieldConfigContext.Consumer>
    {fieldConfig => {
      const FieldImpl =
        props.component || fieldConfig.get(props.type, fieldConfig.get('text'));
      return <FieldImpl {...generateFieldProps(props)} />;
    }}
  </FieldConfigContext.Consumer>
);

const FormImpl = props =>
  props.children({
    form: props.loaded && (
      <form onSubmit={onSubmit(props.formKey)}>
        {props.fields.toList().map(field => (
          <Field
            key={field.get('name')}
            name={field.get('name')}
            id={field.get('id')}
            label={field.get('label')}
            options={field.get('options')}
            type={field.get('type')}
            value={field.get('value')}
            onFocus={onFocus({
              formKey: props.formKey,
              field: field.get('name'),
            })}
            onBlur={onBlur({
              formKey: props.formKey,
              field: field.get('name'),
            })}
            onChange={onChange({
              formKey: props.formKey,
              name: field.get('name'),
              type: field.get('type'),
            })}
            visible={field.get('visible')}
            required={field.get('required')}
            enabled={field.get('enabled')}
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
            component={get(props.components, field.get('name'))}
          />
        ))}
        {props.error && (
          <div>
            {props.error}&nbsp;
            <button onClick={clearError(props.formKey)}>x</button>
          </div>
        )}
        <button type="submit" disabled={props.submitting}>
          Submit
        </button>
      </form>
    ),
  });

export const Form = connect(mapStateToProps)(FormImpl);
