let log = require('../logger');
let _ = require('../utils/mindash');
let StatusConstants = require('../constants/status');

when.all = all;
when.join = join;

function when(handlers, parentContext) {
  handlers || (handlers = {});

  let handler = handlers[this.status.toLowerCase()];

  if (!handler) {
    throw new Error('Could not find a ' + this.status + ' handler');
  }

  if (parentContext) {
    WhenContext.prototype = parentContext;
  }

  try {
    switch (this.status) {
      case StatusConstants.PENDING.toString():
        return handler.call(new WhenContext());
      case StatusConstants.FAILED.toString():
        return handler.call(new WhenContext(), this.error);
      case StatusConstants.DONE.toString():
        return handler.call(new WhenContext(), this.result);
      default:
        throw new Error('Unknown fetch result status');
    }
  } catch (e) {
    let errorMessage = 'An error occured when handling the DONE state of ';

    if (this.id) {
      errorMessage += 'the fetch \'' + this.id + '\'';
    } else {
      errorMessage += 'a fetch';
    }

    if (this.store) {
      errorMessage += ` from the store ${this.store}`;
    }

    log.error(errorMessage, e);

    throw e;
  }

  function WhenContext() {
    _.extend(this, handlers);
  }
}

function join(/* fetchResults, handlers */) {
  let parentContext;
  let handlers = _.last(arguments);
  let fetchResults = _.initial(arguments);

  if (!areHandlers(handlers) && areHandlers(_.last(fetchResults))) {
    parentContext = handlers;
    handlers = fetchResults.pop();
  }

  return all(fetchResults, handlers, parentContext);
}

function all(fetchResults, handlers, parentContext) {
  if (!fetchResults || !handlers) {
    throw new Error('No fetch results or handlers specified');
  }

  if (!_.isArray(fetchResults) || _.any(fetchResults, notFetchResult)) {
    throw new Error('Must specify a set of fetch results');
  }

  let context = {
    result: results(fetchResults),
    error: firstError(fetchResults),
    status: aggregateStatus(fetchResults)
  };

  return when.call(context, handlers, parentContext);
}

function areHandlers(obj) {
  return _.isFunction(obj.done);
}

function results(fetchResults) {
  return fetchResults.map(function (result) {
    return result.result;
  });
}

function firstError(fetchResults) {
  let failedResult = _.find(fetchResults, {
    status: StatusConstants.FAILED.toString()
  });

  if (failedResult) {
    return failedResult.error;
  }
}

function notFetchResult(result) {
  return !result._isFetchResult;
}

function aggregateStatus(fetchResults) {
  for (let i = fetchResults.length - 1; i >= 0; i--) {
    let status = fetchResults[i].status;

    if (status === StatusConstants.FAILED.toString() ||
        status === StatusConstants.PENDING.toString()) {
      return status;
    }
  }

  return StatusConstants.DONE.toString();
}

module.exports = when;