var sinon = require('sinon');
var _ = require('lodash');
var expect = require('chai').expect;
var warnings = require('marty-core/lib/warnings');
var constants = require('marty-constants');

describe('Constants', function () {
  var input, actualResult, actionCreatorContext;

  beforeEach(function () {
    actionCreatorContext = { dispatch: sinon.spy() };

    warnings.invokeConstant = false;
  });

  afterEach(function () {
    warnings.invokeConstant = true;
  });

  describe('when you pass in null', function () {
    it('should return an empty object literal', function () {
      expect(constants(null)).to.eql({});
    });
  });

  describe('when you pass in an array', function () {
    beforeEach(function () {
      input = ['foo', 'bar'];

      actualResult = constants(input);
    });

    it('should create an object with the given keys', function () {
      expect(Object.keys(actualResult)).to.eql(typesWithVariations(['foo', 'bar']));
    });

    it('should create a function for each key', function () {
      input.forEach(function (key) {
        expect(actualResult[key]).to.be.instanceof(Function);
      });
    });

    it('should add a key_{STARTING} key for each key', function () {
      input.forEach(function (key) {
        expect(actualResult[key + '_STARTING']).to.be.instanceof(Function);
      });
    });

    it('should add a key_{FAILED} key for each key', function () {
      input.forEach(function (key) {
        expect(actualResult[key + '_FAILED']).to.be.instanceof(Function);
      });
    });

    it('should add a key_{DONE} key for each key', function () {
      input.forEach(function (key) {
        expect(actualResult[key + '_DONE']).to.be.instanceof(Function);
      });
    });

    it('should create a function that equals the input string', function () {
      input.forEach(function (key) {
        expect(actualResult[key] == key).to.be.true; // jshint ignore:line
      });
    });

    describe('when you invoke the constant action creator', function () {
      describe('when you pass in a function', function () {
        var actionCreator, creatorFunction;

        beforeEach(function () {
          creatorFunction = sinon.spy(function (arg) {
            this.dispatch(arg);
          });
          actionCreator = actualResult.foo(creatorFunction);
        });

        it('should create an action creator', function () {
          expect(actionCreator).to.be.instanceof(Function);
        });

        describe('when I call the action creator', function () {
          var expectedArg;
          beforeEach(function () {
            expectedArg = 1;

            actionCreator.call(actionCreatorContext, expectedArg);
          });

          it('should have called the creator function', function () {
            expect(actionCreatorContext.dispatch).to.have.been.calledWith('foo', expectedArg);
          });
        });
      });

      describe('when I dont pass in a function as the first argument', function () {
        var actionCreator;

        beforeEach(function () {
          actionCreator = actualResult.foo();
        });

        it('should create an action creator', function () {
          expect(actionCreator).to.be.instanceof(Function);
        });

        describe('when I call the action creator', function () {
          var expectedArg1, expectedArg2;
          beforeEach(function () {
            expectedArg1 = 1;
            expectedArg2 = 'bar';

            actionCreator.call(actionCreatorContext, expectedArg1, expectedArg2);
          });

          it('should have called the creator function', function () {
            expect(actionCreatorContext.dispatch).to.have.been.calledWith('foo', expectedArg1, expectedArg2);
          });
        });
      });
    });
  });

  describe('when you pass in an object of arrays', function () {
    beforeEach(function () {
      var input = {
        foo: ['bar', 'baz'],
        bim: ['bam']
      };

      actualResult = constants(input);
    });

    it('should return an object of constants', function () {
      expect(Object.keys(actualResult)).to.eql(['foo', 'bim']);
      expect(Object.keys(actualResult.foo)).to.eql(typesWithVariations(['bar', 'baz']));
      expect(Object.keys(actualResult.bim)).to.eql(typesWithVariations(['bam']));
    });
  });

  describe('when I pass in a crazy combination of object literals and arrays', function () {
    beforeEach(function () {
      var input = {
        foo: ['bar', 'baz'],
        bim: {
          bam: ['what'],
          top: {
            flop: ['bop', 'hot']
          }
        }
      };

      actualResult = constants(input);
    });

    it('should return an object of constants', function () {
      expect(Object.keys(actualResult.bim)).to.eql(['bam', 'top']);
      expect(Object.keys(actualResult.bim.bam)).to.eql(typesWithVariations(['what']));
      expect(Object.keys(actualResult.bim.top.flop)).to.eql(typesWithVariations(['bop', 'hot']));
    });
  });

  function typesWithVariations(types) {
    var res = [];

    _.each(types, function (type) {
      res.push(type);
      res.push(type + '_STARTING');
      res.push(type + '_DONE');
      res.push(type + '_FAILED');
    });

    return res;
  }
});