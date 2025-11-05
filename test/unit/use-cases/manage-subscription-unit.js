/*
  Unit tests for ManageSubscriptionUseCase.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Mocking data libraries
import { mockKind1Event } from '../mocks/event-mocks.js'

// Unit under test
import ManageSubscriptionUseCase from '../../../src/use-cases/manage-subscription.js'

describe('#manage-subscription.js', () => {
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

    uut = new ManageSubscriptionUseCase({ adapters: mockAdapters })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#createSubscription()', () => {
    it('should successfully create a subscription', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]
      let onEventCalled = false
      let onEoseCalled = false
      let onClosedCalled = false

      const onEvent = (event) => {
        onEventCalled = true
      }
      const onEose = () => {
        onEoseCalled = true
      }
      const onClosed = (message) => {
        onClosedCalled = true
      }

      // Mock adapter to capture handlers
      let handlersCaptured = null
      mockAdapters.nostrRelay.sendReq.callsFake((subId, filterArray, handlers) => {
        handlersCaptured = handlers
      })

      await uut.createSubscription(subscriptionId, filters, onEvent, onEose, onClosed)

      // Assert adapter was called
      assert.isTrue(mockAdapters.nostrRelay.sendReq.calledOnce)
      const sendReqArgs = mockAdapters.nostrRelay.sendReq.getCall(0).args
      assert.equal(sendReqArgs[0], subscriptionId)
      assert.deepEqual(sendReqArgs[1], filters)

      // Assert subscription is tracked
      assert.isTrue(uut.hasSubscription(subscriptionId))

      // Test handlers are called
      handlersCaptured.onEvent(mockKind1Event)
      assert.isTrue(onEventCalled)

      handlersCaptured.onEose()
      assert.isTrue(onEoseCalled)

      handlersCaptured.onClosed('test message')
      assert.isTrue(onClosedCalled)
      assert.isFalse(uut.hasSubscription(subscriptionId))
    })

    it('should prevent duplicate subscriptions', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]

      mockAdapters.nostrRelay.sendReq.resolves()

      await uut.createSubscription(subscriptionId, filters)

      try {
        await uut.createSubscription(subscriptionId, filters)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'already exists')
      }
    })

    it('should clean up subscription on error', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]

      mockAdapters.nostrRelay.sendReq.rejects(new Error('Connection error'))

      try {
        await uut.createSubscription(subscriptionId, filters)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Connection error')
        assert.isFalse(uut.hasSubscription(subscriptionId))
      }
    })

    it('should handle missing callbacks gracefully', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]

      let handlersCaptured = null
      mockAdapters.nostrRelay.sendReq.callsFake((subId, filterArray, handlers) => {
        handlersCaptured = handlers
      })

      await uut.createSubscription(subscriptionId, filters, null, null, null)

      // Should not throw when handlers are null
      handlersCaptured.onEvent(mockKind1Event)
      handlersCaptured.onEose()
      handlersCaptured.onClosed('test')
    })
  })

  describe('#closeSubscription()', () => {
    it('should successfully close a subscription', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]

      mockAdapters.nostrRelay.sendReq.resolves()
      mockAdapters.nostrRelay.sendClose.resolves()

      // Create subscription first
      await uut.createSubscription(subscriptionId, filters)
      assert.isTrue(uut.hasSubscription(subscriptionId))

      // Close subscription
      await uut.closeSubscription(subscriptionId)

      // Assert adapter was called
      assert.isTrue(mockAdapters.nostrRelay.sendClose.calledOnce)
      assert.equal(mockAdapters.nostrRelay.sendClose.getCall(0).args[0], subscriptionId)

      // Assert subscription is removed
      assert.isFalse(uut.hasSubscription(subscriptionId))
    })

    it('should throw error when closing non-existent subscription', async () => {
      const subscriptionId = 'non-existent-sub'

      try {
        await uut.closeSubscription(subscriptionId)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'not found')
      }
    })

    it('should clean up subscription even on error', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]

      mockAdapters.nostrRelay.sendReq.resolves()
      mockAdapters.nostrRelay.sendClose.rejects(new Error('Close error'))

      // Create subscription first
      await uut.createSubscription(subscriptionId, filters)

      try {
        await uut.closeSubscription(subscriptionId)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Close error')
        // Should still clean up
        assert.isFalse(uut.hasSubscription(subscriptionId))
      }
    })
  })

  describe('#hasSubscription()', () => {
    it('should return false for non-existent subscription', () => {
      assert.isFalse(uut.hasSubscription('non-existent'))
    })

    it('should return true for existing subscription', async () => {
      const subscriptionId = 'test-sub-123'
      const filters = [{ kinds: [1] }]

      mockAdapters.nostrRelay.sendReq.resolves()

      assert.isFalse(uut.hasSubscription(subscriptionId))
      await uut.createSubscription(subscriptionId, filters)
      assert.isTrue(uut.hasSubscription(subscriptionId))
    })
  })

  describe('#constructor()', () => {
    it('should require adapters instance', () => {
      try {
        // eslint-disable-next-line no-new
        new ManageSubscriptionUseCase()
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Adapters instance required')
      }
    })

    it('should require NostrRelay adapter', () => {
      try {
        // eslint-disable-next-line no-new
        new ManageSubscriptionUseCase({ adapters: {} })
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'NostrRelay adapter required')
      }
    })
  })
})
