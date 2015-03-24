let log = require('../logger');
let _ = require('../utils/mindash');
let warnings = require('../warnings');
let Instances = require('../instances');
let fetchResult = require('./fetchResult');
let StoreEvents = require('./storeEvents');
let CompoundError = require('../errors/compound');
let NotFoundError = require('../errors/notFound');
let StoreConstants = require('../constants/store');
let StatusConstants = require('../constants/status');

function fetch(id, local, remote) {
  let store = this, instance = Instances.get(this);
  let options, result, error, cacheError, context = this.context;

  if (_.isObject(id)) {
    options = id;
  } else {
    options = {
      id: id,
      locally: local,
      remotely: remote
    };
  }

  _.defaults(options, {
    locally: _.noop,
    remotely: _.noop
  });

  if (!options || _.isUndefined(options.id)) {
    throw new Error('must specify an id');
  }

  result = dependencyResult(this, options);

  if (result) {
    return result;
  }

  cacheError = _.isUndefined(options.cacheError) || options.cacheError;

  if (cacheError) {
    error = instance.failedFetches[options.id];

    if (error) {
      return fetchFailed(error);
    }
  }

  if (instance.fetchInProgress[options.id]) {
    return fetchResult.pending(options.id, store);
  }

  if (context) {
    context.fetchStarted(store.id, options.id);
  }

  return tryAndGetLocally() || tryAndGetRemotely();

  function tryAndGetLocally(remoteCalled) {
    try {
      let result = options.locally.call(store);

      if (_.isUndefined(result)) {
        return;
      }

      if (_.isNull(result)) {
        return fetchNotFound();
      }

      if (!remoteCalled) {
        finished();
      }

      return fetchDone(result);
    } catch (error) {
      return fetchFailed(error);
    }
  }

  function tryAndGetRemotely() {
    try {
      result = options.remotely.call(store);

      if (result) {
        if (_.isFunction(result.then)) {
          instance.fetchInProgress[options.id] = true;

          result.then(function () {
            instance.fetchHistory[options.id] = true;
            result = tryAndGetLocally(true);

            if (result) {
              fetchDone();
              store.hasChanged();
            } else {
              fetchNotFound();
              store.hasChanged();
            }
          }).catch(function (error) {
            fetchFailed(error);
            store.hasChanged();

            instance.dispatcher.dispatchAction({
              type: StoreConstants.FETCH_FAILED,
              arguments: [
                error,
                options.id,
                store
              ]
            });
          });

          return fetchPending();
        } else {
          instance.fetchHistory[options.id] = true;
          result = tryAndGetLocally(true);

          if (result) {
            return result;
          }
        }
      }

      if (warnings.promiseNotReturnedFromRemotely) {
        log.warn(promiseNotReturnedWarning());
      }

      return fetchNotFound();
    } catch (error) {
      return fetchFailed(error);
    }
  }

  function promiseNotReturnedWarning() {
    let inStore = '';
    if (store.displayName) {
      inStore = ' in ' + store.displayName;
    }

    return `The remote fetch for '${options.id}' ${inStore} ` +
      'did not return a promise and the state was ' +
      'not present after remotely finished executing. ' +
      'This might be because you forgot to return a promise.';
  }

  function finished() {
    instance.fetchHistory[options.id] = true;

    delete instance.fetchInProgress[options.id];
  }

  function fetchPending() {
    return fetchResult.pending(options.id, store);
  }

  function fetchDone(result) {
    finished();

    if (context && result) {
      context.fetchDone(store.id, options.id, 'DONE', {
        result: result
      });
    }

    return fetchChanged(fetchResult.done(result, options.id, store));
  }

  function fetchFailed(error) {
    if (cacheError) {
      instance.failedFetches[options.id] = error;
    }

    finished();

    if (context) {
      context.fetchDone(store.id, options.id, 'FAILED', {
        error: error
      });
    }

    return fetchChanged(fetchResult.failed(error, options.id, store));
  }

  function fetchNotFound() {
    return fetchFailed(new NotFoundError(), options.id, store);
  }

  function fetchChanged(fetch) {
    instance.emitter.emit(StoreEvents.FETCH_CHANGE_EVENT, fetch);
    return fetch;
  }
}

function dependencyResult(store, options) {
  let pending = false;
  let errors = [];
  let dependencies = options.dependsOn;

  if (!dependencies) {
    return;
  }

  if (!_.isArray(dependencies)) {
    dependencies = [dependencies];
  }

  _.each(dependencies, (dependency) => {
    switch (dependency.status) {
      case StatusConstants.PENDING.toString():
        pending = true;
        break;
      case StatusConstants.FAILED.toString():
        errors.push(dependency.error);
        break;
    }
  });

  if (errors.length) {
    let error = errors.length === 1 ? errors[0] : new CompoundError(errors);

    return fetchResult.failed(error, options.id, store);
  }

  if (pending) {
    // Wait for all dependencies to be done and then notify listeners
    Promise
      .all(_.invoke(dependencies, 'toPromise'))
      .then(() => {
        store.fetch(options);
        store.hasChanged();
      })
      .catch(() => {
        store.fetch(options);
        store.hasChanged();
      });

    return fetchResult.pending(options.id, store);
  }
}

fetch.done = fetchResult.done;
fetch.failed = fetchResult.failed;
fetch.pending = fetchResult.pending;
fetch.notFound = fetchResult.notFound;

module.exports = fetch;