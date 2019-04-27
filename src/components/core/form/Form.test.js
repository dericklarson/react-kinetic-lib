import { List, Map, OrderedMap } from 'immutable/dist/immutable-nonambient';
import { initializeDataSources, validateFields } from './Form';

describe('initializeDataSources', () => {
  test('converts input into normalized datasource shape', () => {
    const fn = () => 1;
    const argsFn = () => 2;
    expect(
      initializeDataSources({
        user: [fn, argsFn, { shared: true }],
      }),
    ).toEqualImmutable(
      Map({
        user: Map({
          fn,
          argsFn,
          options: Map({ shared: true, ancestorDependencies: List() }),
        }),
      }),
    );
  });

  test('given static args array converts to funciton that returns the array', () => {
    const fn = () => 1;
    const args = ['foo', 'bar', 'baz'];
    const result = initializeDataSources({
      user: [fn, args],
    });
    expect(result.getIn(['user', 'fn'])).toBe(fn);
    expect(result.getIn(['user', 'argsFn'])()).toBe(args);
    expect(result.getIn(['user', 'options'])).toEqualImmutable(
      Map({ ancestorDependencies: List() }),
    );
  });

  test('converts static args array into function that returns the given array', () => {
    const fn = () => 1;
    const argsFn = () => 2;
    expect(
      initializeDataSources({
        user: [fn, argsFn, { shared: true }],
      }),
    ).toEqualImmutable(
      Map({
        user: Map({
          fn,
          argsFn,
          options: Map({ shared: true, ancestorDependencies: List() }),
        }),
      }),
    );
  });

  test('defaults options into empty map', () => {
    const fn = () => 1;
    const argsFn = () => 2;
    expect(
      initializeDataSources({
        user: [fn, argsFn],
      }),
    ).toEqualImmutable(
      Map({
        user: Map({
          fn,
          argsFn,
          options: Map({ ancestorDependencies: List() }),
        }),
      }),
    );
  });

  test('defaults argsFn to one that returns empty array', () => {
    const fn = () => 1;
    const result = initializeDataSources({
      user: [fn],
    });
    expect(result.getIn(['user', 'fn'])).toBe(fn);
    expect(result.getIn(['user', 'argsFn'])()).toEqual([]);
    expect(result.getIn(['user', 'options'])).toEqualImmutable(
      Map({ ancestorDependencies: List() }),
    );
  });

  test('populates ancestorDependencies', () => {
    const fn = () => 1;
    const result = initializeDataSources({
      other: [fn, [], { dependencies: [] }],
      another: [fn, [], { dependencies: ['other'] }],
      user: [fn, [], { dependencies: ['values'] }],
      teams: [fn, [], { dependencies: ['user'] }],
      final: [fn, [], { dependencies: ['teams', 'another'] }],
    });
    expect(
      result.getIn(['other', 'options', 'ancestorDependencies']),
    ).toEqualImmutable(List());
    expect(
      result.getIn(['user', 'options', 'ancestorDependencies']),
    ).toEqualImmutable(List(['values']));
    expect(
      result.getIn(['another', 'options', 'ancestorDependencies']),
    ).toEqualImmutable(List(['other']));
    expect(
      result.getIn(['teams', 'options', 'ancestorDependencies']),
    ).toEqualImmutable(List(['user', 'values']));
    expect(
      result.getIn(['final', 'options', 'ancestorDependencies']),
    ).toEqualImmutable(List(['another', 'other', 'teams', 'user', 'values']));
  });

  test('detects cyclical dependencies', () => {
    const fn = () => 1;
    expect(() =>
      initializeDataSources({
        other: [fn, [], { dependencies: ['another'] }],
        another: [fn, [], { dependencies: ['other'] }],
      }),
    ).toThrow(/cyclic/);
  });
});

describe('validateFields', () => {
  test('required but present', () => {
    const result = validateFields(
      OrderedMap([
        ['First Name', Map({ required: true, value: 'foo' })],
        ['Last Name', Map({ required: false, value: 'foo' })],
      ]),
    );
    expect(result.map(f => f.get('errors'))).toEqualImmutable(
      OrderedMap([['First Name', List([])], ['Last Name', List([])]]),
    );
  });

  test('required and missing', () => {
    const result = validateFields(
      OrderedMap([
        ['First Name', Map({ required: true, value: '' })],
        [
          'Last Name',
          Map({
            required: true,
            requiredMessage: 'Last name is required!',
            value: '',
          }),
        ],
        ['Other', Map({ required: false, value: '' })],
      ]),
    );
    expect(result.map(f => f.get('errors'))).toEqualImmutable(
      OrderedMap([
        ['First Name', List(['is required'])],
        ['Last Name', List(['Last name is required!'])],
        ['Other', List()],
      ]),
    );
  });

  test('pattern', () => {
    const result = validateFields(
      OrderedMap([
        ['a', Map({ pattern: /^\d+$/, value: 'foo' })],
        ['b', Map({ pattern: /^\d+$/, patternMessage: 'num', value: 'foo' })],
        ['c', Map({ pattern: /^\d+$/, value: '21' })],
        ['d', Map({ pattern: /^\d+$/, value: '' })],
      ]),
    );
    expect(result.map(f => f.get('errors'))).toEqualImmutable(
      OrderedMap([
        ['a', List(['invalid format'])],
        ['b', List(['num'])],
        ['c', List()],
        ['d', List()],
      ]),
    );
  });

  test('custom constraint', () => {
    const result = validateFields(
      OrderedMap([
        [
          'a',
          Map({
            constraint: ({ values }) => values.get('a') === values.get('b'),
            value: 'foo',
          }),
        ],
        [
          'b',
          Map({
            constraint: ({ values }) => values.get('a') === values.get('b'),
            constraintMessage: 'a and b must be equal',
            value: 'bar',
          }),
        ],
        [
          'c',
          Map({
            constraint: ({ values }) => values.get('c') === '',
            value: '',
          }),
        ],
      ]),
    );
    expect(result.map(f => f.get('errors'))).toEqualImmutable(
      OrderedMap([
        ['a', List(['invalid'])],
        ['b', List(['a and b must be equal'])],
        ['c', List()],
      ]),
    );
  });
});
