let log = require('../logger');
let _ = require('../utils/mindash');
let warnings = require('../warnings');

function constants(obj) {
  return toConstant(obj);

  function toConstant(obj) {
    if (!obj) {
      return {};
    }

    if (_.isArray(obj)) {
      return arrayToConstants(obj);
    }

    if (_.isObject(obj)) {
      return objectToConstants(obj);
    }
  }

  function objectToConstants(obj) {
    return _.object(_.map(obj, valueToArray));

    function valueToArray(value, actionType) {
      return [actionType, toConstant(value)];
    }
  }

  function arrayToConstants(array) {
    let constants = {};

    _.each(array, function (actionType) {
      let types = [
        actionType,
        actionType + '_STARTING',
        actionType + '_DONE',
        actionType + '_FAILED'
      ];

      _.each(types, function (type) {
        constants[type] = createActionCreator(type);
      });
    });

    return constants;
  }

  function createActionCreator(actionType) {
    let constantActionCreator = function (actionCreator) {
      if (warnings.invokeConstant) {
        log.warn(
          'Warning: Invoking constants has been depreciated. ' +
          'Please migrate to new style of creating action creators ' +
          'http://martyjs.org/guides/action-creators/migrating-from-v8.html'
        );
      }

      if (!_.isFunction(actionCreator)) {
        actionCreator = autoDispatch;
      }

      return function () {
        let context = actionContext(this);

        actionCreator.apply(context, arguments);

        function actionContext(creators) {
          return _.extend({}, creators, {
            dispatch: function () {
              let args = _.toArray(arguments);

              args.unshift(actionType);

              creators.dispatch.apply(creators, args);
            }
          });
        }
      };

      function autoDispatch() {
        this.dispatch.apply(this, arguments);
      }
    };

    constantActionCreator.type = actionType;
    constantActionCreator.isActionCreator = true;
    constantActionCreator.toString = function () {
      return actionType;
    };

    return constantActionCreator;
  }
}

module.exports = constants;