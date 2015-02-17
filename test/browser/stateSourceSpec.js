var Marty = require('../../index');
var expect = require('chai').expect;
var StateSource = require('../../lib/stateSource');

describe('StateSource', function () {
  var stateSource;

  describe('#createStateSource()', function () {
    describe('when you pass in a function', function () {
      var expectedResult;

      beforeEach(function () {
        expectedResult = 'foo';
        stateSource = Marty.createStateSource({
          id: 'createStateSource',
          foo: function () {
            return this.bar();
          },
          bar: function () {
            return expectedResult;
          }
        });
      });

      it('should expose the function', function () {
        expect(stateSource.foo()).to.equal(expectedResult);
      });
    });

    describe('#type', function () {
      describe('jsonStorage', function () {
        beforeEach(function () {
          stateSource = Marty.createStateSource({
            id: 'jsonStorage',
            type: 'jsonStorage'
          });
        });

        it('should mixin the JSONStorageStateSource', function () {
          expect(stateSource._isJSONStorageStateSource).to.be.true;
        });
      });

      describe('localStorage', function () {
        beforeEach(function () {
          stateSource = Marty.createStateSource({
            id: 'localStorage',
            type: 'localStorage'
          });
        });

        it('should mixin the LocalStorageStateSource', function () {
          expect(stateSource._isLocalStorageStateSource).to.be.true;
        });
      });

      describe('sessionStorage', function () {
        beforeEach(function () {
          stateSource = Marty.createStateSource({
            id: 'sessionStorage',
            type: 'sessionStorage'
          });
        });

        it('should mixin the SessionStorageStateSource', function () {
          expect(stateSource._isSessionStorageStateSource).to.be.true;
        });
      });

      describe('http', function () {
        beforeEach(function () {
          stateSource = Marty.createStateSource({
            id: 'http',
            type: 'http'
          });
        });

        it('should mixin the HttpStateSource', function () {
          expect(stateSource._isHttpStateSource).to.be.true;
        });
      });
    });
  });

  describe('#mixins', function () {
    describe('when you have multiple mixins', function () {
      beforeEach(function () {
        stateSource = new StateSource({
          mixins: [{
            foo: function () { return 'foo'; }
          }, {
            bar: function () { return 'bar'; }
          }]
        });
      });

      it('should allow you to mixin object literals', function () {
        expect(stateSource.foo()).to.equal('foo');
        expect(stateSource.bar()).to.equal('bar');
      });
    });
  });
});