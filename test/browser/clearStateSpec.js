var expect = require('chai').expect;

describe('Marty#clearState()', function () {
  var Marty = require('../../index');
  var Store1, Store2, store1ExpectedState, store2ExpectedState;

  beforeEach(function () {
    store1ExpectedState = { initial: 'store1' };
    store2ExpectedState = { initial: 'store2' };

    Store1 = Marty.createStore({
      id: 'clearState1',
      getInitialState: function () {
        return store1ExpectedState;
      }
    });

    Store2 = Marty.createStore({
      id: 'clearState2',
      getInitialState: function () {
        return store2ExpectedState;
      }
    });

    Marty.setInitialState({
      clearState1: { foo: 'bar' },
      clearState2: { bar: 'baz' }
    });

    Marty.clearState();
  });

  it('should reset the store state to its initial state', function () {
    expect(Store1.getState()).to.equal(store1ExpectedState);
    expect(Store2.getState()).to.equal(store2ExpectedState);
  });
});

