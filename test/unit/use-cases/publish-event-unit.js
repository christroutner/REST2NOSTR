/*
  Unit tests for PublishEventUseCase.
*/

// npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Mocking data libraries
import {
  mockKind1Event,
  mockInvalidEventMissingId
} from '../mocks/event-mocks.js'
import {
  mockSendEventSuccess,
  mockSendEventFailure
} from '../mocks/nostr-relay-mocks.js'

// Unit under test
import PublishEventUseCase from '../../../src/use-cases/publish-event.js'

describe('#publish-event.js', () => {
  let sandbox
  let mockAdapters
  let uut

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    // Create mock adapters
    mockAdapters = {
      nostrRelay: {
        sendEvent: sandbox.stub()
      }
    }

    uut = new PublishEventUseCase({ adapters: mockAdapters })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#execute()', () => {
    it('should successfully publish a valid event', async () => {
      // Mock adapter response
      mockAdapters.nostrRelay.sendEvent.resolves(mockSendEventSuccess)

      const result = await uut.execute(mockKind1Event)

      // Assert adapter was called correctly
      assert.isTrue(mockAdapters.nostrRelay.sendEvent.calledOnce)
      const callArgs = mockAdapters.nostrRelay.sendEvent.getCall(0).args[0]
      assert.equal(callArgs.id, mockKind1Event.id)
      assert.equal(callArgs.kind, mockKind1Event.kind)

      // Assert result
      assert.property(result, 'accepted')
      assert.property(result, 'message')
      assert.property(result, 'eventId')
      assert.isTrue(result.accepted)
      assert.equal(result.eventId, mockKind1Event.id)
    })

    it('should handle event rejection from relay', async () => {
      // Mock adapter response (rejected)
      mockAdapters.nostrRelay.sendEvent.resolves(mockSendEventFailure)

      const result = await uut.execute(mockKind1Event)

      // Assert result shows rejection
      assert.isFalse(result.accepted)
      assert.property(result, 'message')
      assert.equal(result.eventId, mockKind1Event.id)
    })

    it('should throw error for invalid event structure', async () => {
      try {
        await uut.execute(mockInvalidEventMissingId)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Invalid event structure')
        assert.isFalse(mockAdapters.nostrRelay.sendEvent.called)
      }
    })

    it('should handle adapter errors', async () => {
      // Mock adapter error
      const adapterError = new Error('Network error')
      mockAdapters.nostrRelay.sendEvent.rejects(adapterError)

      try {
        await uut.execute(mockKind1Event)
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.equal(err.message, 'Network error')
        assert.isTrue(mockAdapters.nostrRelay.sendEvent.calledOnce)
      }
    })

    it('should require adapters instance', () => {
      try {
        // eslint-disable-next-line no-new
        new PublishEventUseCase()
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Adapters instance required')
      }
    })

    it('should require NostrRelay adapter', () => {
      try {
        // eslint-disable-next-line no-new
        new PublishEventUseCase({ adapters: {} })
        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'NostrRelay adapter required')
      }
    })
  })
})
