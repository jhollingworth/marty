let log = require('./logger');
let _ = require('./utils/mindash');
let Instances = require('./instances');
let UnknownStoreError = require('./errors/unknownStore');

let SERIALIZED_WINDOW_OBJECT = '__marty';

module.exports = {
  rehydrate: rehydrate,
  dehydrate: dehydrate,
  clearState: clearState,
  replaceState: replaceState
};

function getDefaultStores(context) {
  return context.registry.getAllDefaultStores();
}

function clearState() {
  _.each(getDefaultStores(this), function (store) {
    store.clear();
  });
}

function replaceState(states) {
  _.each(getDefaultStores(this), function (store) {
    let id = storeId(store);

    if (states[id]) {
      store.replaceState(states[id]);
    }
  });
}

function rehydrate(storeStates) {
  let stores = indexById(getDefaultStores(this));
  storeStates = storeStates || getStoreStatesFromWindow();

  _.each(storeStates, function (dehydratedStore, storeName) {
    let store = stores[storeName];
    let state = dehydratedStore.state;

    if (!store) {
      throw new UnknownStoreError(storeName);
    }

    let instance = Instances.get(store);

    instance.fetchHistory = dehydratedStore.fetchHistory;

    if (_.isFunction(store.rehydrate)) {
      store.rehydrate(state);
    } else {
      try {
        store.replaceState(state);
      } catch (e) {
        log.error(
          `Failed to rehydrate the state of ${storeName}. You might be able ` +
          `to solve this problem by implementing Store#rehydrate()`
        );

        throw e;
      }
    }
  });

  function indexById(stores) {
    return _.object(_.map(stores, function (store) {
      return storeId(store);
    }), stores);
  }

  function getStoreStatesFromWindow() {
    if (!window || !window[SERIALIZED_WINDOW_OBJECT]) {
      return;
    }

    return window[SERIALIZED_WINDOW_OBJECT].stores;
  }
}

function dehydrate(context) {
  let dehydratedStores = {};
  let stores = context ? context.getAllStores() : getDefaultStores(this);

  _.each(stores, function (store) {
    let id = storeId(store);

    if (id) {
      let instance = Instances.get(store);

      dehydratedStores[id] = {
        fetchHistory: instance.fetchHistory,
        state: (store.dehydrate || store.getState).call(store)
      };
    }
  });

  dehydratedStores.toString = function () {
    return `(window.__marty||(window.__marty={})).stores=${JSON.stringify(dehydratedStores)}`;
  };

  dehydratedStores.toJSON = function () {
    return _.omit(dehydratedStores, 'toString', 'toJSON');
  };

  return dehydratedStores;
}

function storeId(store) {
  return store.constructor.id;
}