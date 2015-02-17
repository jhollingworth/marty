var util = require('util');
var sinon = require('sinon');
var when = require('../../when');
var fetch = require('../../fetch');
var expect = require('chai').expect;
var stubbedLogger = require('../lib/stubbedLogger');

describe('when', function () {
  var handlers, logger, expectedResult1, expectedResult2, expectedError;

  beforeEach(function () {
    logger = stubbedLogger();
    expectedError = new Error();
    expectedResult1 = { foo: 'bar' };
    expectedResult2 = { baz: 'bam' };
    handlers = {
      pending: sinon.stub(),
      failed: sinon.stub(),
      done: sinon.stub()
    };
  });

  afterEach(function () {
    logger.restore();
  });

  describe('when an error occurs in a when handler', function () {
    var expectedError, expectedFetchId, expectedStore;

    beforeEach(function () {
      expectedStore = 'Foo';
      expectedFetchId = '123';
      expectedError = new Error('bar');

      var doneFetch = fetch.done({}, expectedFetchId, {
        displayName: expectedStore
      });

      try {
        doneFetch.when({
          done: function () {
            throw expectedError;
          }
        });
      } catch (e) { }
    });

    it('should log the error and any additional metadata', function () {
      var expectedMessage = util.format(
        'An error occured when handling the DONE state of the fetch \'%s\' from the store %s',
        expectedFetchId,
        expectedStore
      );

      expect(logger.error).to.be.calledWith(expectedMessage, expectedError);
    });
  });

  describe('#all()', function () {
    describe('when you pass in no arguments', function () {
      it('should throw an error', function () {
        expect(noArguments).to.throw(Error);

        function noArguments() {
          when.all();
        }
      });
    });

    describe('when you pass in an array and no handlers', function () {
      it('should throw an error', function () {
        expect(noHandlers).to.throw(Error);

        function noHandlers() {
          when.all([fetch.pending()]);
        }
      });
    });

    describe('when you pass in a non fetch result', function () {
      it('should throw an error', function () {
        expect(notFetchResult).to.throw(Error);

        function notFetchResult() {
          when.all([{foo: 'bar'}], handlers);
        }
      });
    });

    describe('when you pass in an array of fetch results and handlers', function () {
      describe('when one of the fetch results has failed', function () {
        beforeEach(function () {
          when.all([
            fetch.done(),
            fetch.pending(),
            fetch.failed(expectedError)
          ], handlers);
        });

        it('should execute the failed handler', function () {
          expect(handlers.failed).to.have.been.calledWith(expectedError);
        });
      });

      describe('when one of the fetch results is pending', function () {
        beforeEach(function () {
          when.all([
            fetch.done(),
            fetch.done(),
            fetch.pending()
          ], handlers);
        });

        it('should execute the pending handler', function () {
          expect(handlers.pending).to.have.been.called;
        });
      });

      describe('when all of the fetch results are done', function () {
        beforeEach(function () {
          when.all([
            fetch.done(expectedResult1),
            fetch.done(expectedResult2),
          ], handlers);
        });

        it('should execute the done handler', function () {
          expect(handlers.done).to.have.been.calledWith([expectedResult1, expectedResult2]);
        });
      });
    });
  });

  describe('#join()', function () {
    describe('when you pass in no arguments', function () {
      it('should throw an error', function () {
        expect(noArguments).to.throw(Error);

        function noArguments() {
          when.all();
        }
      });
    });

    describe('when you pass in an array and no handlers', function () {
      it('should throw an error', function () {
        expect(noHandlers).to.throw(Error);

        function noHandlers() {
          when.all([fetch.pending()]);
        }
      });
    });

    describe('when you pass in a non fetch result', function () {
      it('should throw an error', function () {
        expect(notFetchResult).to.throw(Error);

        function notFetchResult() {
          when.all([{foo: 'bar'}], handlers);
        }
      });
    });

    describe('when one of the fetch results has failed', function () {
      beforeEach(function () {
        when.join(
          fetch.done(),
          fetch.pending(),
          fetch.failed(expectedError),
          handlers
        );
      });

      it('should execute the failed handler', function () {
        expect(handlers.failed).to.have.been.calledWith(expectedError);
      });
    });

    describe('when one of the fetch results is pending', function () {
      beforeEach(function () {
        when.join(
          fetch.done(),
          fetch.done(),
          fetch.pending(),
          handlers
        );
      });

      it('should execute the pending handler', function () {
        expect(handlers.pending).to.have.been.called;
      });
    });

    describe('when all of the fetch results are done', function () {
      beforeEach(function () {
        when.join(
          fetch.done(expectedResult1),
          fetch.done(expectedResult2),
          handlers
        );
      });

      it('should execute the done handler', function () {
        expect(handlers.done).to.have.been.calledWith([expectedResult1, expectedResult2]);
      });
    });
  });
});