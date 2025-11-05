/*
  Unit tests for QueryEventsUseCase.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Mocking data libraries
import { mockEventsArray } from '../mocks/nostr-relay-mocks.js'

// Unit under test
import QueryEventsUseCase from '../../../src/use-cases/query-events.js'

describe('#query-events.js', () => {
  let sandbox
  let mockAdapters
  let uut

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    // Create mock adapters
    mockAdapters = {
      nostrRelay: {
        sendReq: sandbox.stub(),
        sendClose: sandbox.stub()
      }
    }

    uut = new QueryEventsUseCase({ adapters: mockAdapters })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#execute()', () => {
    it('should successfully query events and return them', async () => {
      const filters = [{ kinds: [1], limit: 10 }]
      const subscriptionId = 'test-sub-123'

      // Mock handlers that capture events
      mockAdapters.nostrRelay.sendReq.callsFake((subId, filterArray, handlers) => {
        // Simulate receiving events
        setTimeout(() => {
          mockEventsArray.forEach(event => {
            handlers.onEvent(event)
          })
          handlers.onEose()
        }, 10)
      })

      mockAdapters.nostrRelay.sendClose.resolves()

      const resultPromise = uut.execute(filters, subscriptionId)

      // Wait a bit for events to be received
      await new Promise(resolve => setTimeout(resolve, 50))

      const result = await resultPromise

      // Assert adapter was called correctly
      assert.isTrue(mockAdapters.nostrRelay.sendReq.calledOnce)
      const sendReqArgs = mockAdapters.nostrRelay.sendReq.getCall(0).args
      assert.equal(sendReqArgs[0], subscriptionId)
      assert.deepEqual(sendReqArgs[1], filters)

      // Assert close was called
      assert.isTrue(mockAdapters.nostrRelay.sendClose.calledOnce)
      assert.equal(mockAdapters.nostrRelay.sendClose.getCall(0).args[0], subscriptionId)

      // Assert result contains events
      assert.isArray(result)
      assert.equal(result.length, mockEventsArray.length)
    })

    it('should handle CLOSED message from relay', async () => {
      const filters = [{ kinds: [1] }]
      const subscriptionId = 'test-sub-123'

      // Mock handlers that send CLOSED
      mockAdapters.nostrRelay.sendReq.callsFake((subId, filterArray, handlers) => {
        setTimeout(() => {
          handlers.onClosed('Subscription closed by relay')
        }, 10)
      })

      mockAdapters.nostrRelay.sendClose.resolves()

      try {
        await uut.execute(filters, subscriptionId)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Subscription closed')
        assert.include(err.message, 'Subscription closed by relay')
      }
    })

    it('should handle timeout when EOSE not received', async function () {
      this.timeout(5000) // Reduced timeout since we're using stubs
      const filters = [{ kinds: [1] }]
      const subscriptionId = 'test-sub-123'

      // Mock handlers that never send EOSE
      mockAdapters.nostrRelay.sendReq.callsFake(() => {
        // Don't call any handlers - this simulates EOSE never being received
      })

      mockAdapters.nostrRelay.sendClose.resolves()

      // Stub Date.now() to simulate time passing
      // First call sets startTime, subsequent calls should exceed timeout
      const realStartTime = Date.now()
      let callCount = 0
      sandbox.stub(Date, 'now').callsFake(() => {
        callCount++
        // Allow first few calls to return real time (logger + startTime assignment)
        // After that, return time that exceeds timeout (30s = 30000ms)
        if (callCount <= 2) {
          return realStartTime
        } else {
          return realStartTime + 30001
        }
      })

      // Stub setTimeout to execute immediately
      const originalSetTimeout = global.setTimeout
      sandbox.stub(global, 'setTimeout').callsFake((fn, delay) => {
        // Execute the callback immediately but asynchronously
        return originalSetTimeout(fn, 0)
      })

      // Start the execute promise
      const resultPromise = uut.execute(filters, subscriptionId)

      // Wait for the promise to resolve
      const result = await resultPromise

      // Should return empty array after timeout
      assert.isArray(result)
      assert.equal(result.length, 0)
    })

    it('should require adapters instance', () => {
      try {
        // eslint-disable-next-line no-new
        new QueryEventsUseCase()
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Adapters instance required')
      }
    })

    it('should require NostrRelay adapter', () => {
      try {
        // eslint-disable-next-line no-new
        new QueryEventsUseCase({ adapters: {} })
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'NostrRelay adapter required')
      }
    })
  })
})
