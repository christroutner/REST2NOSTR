/*
  Use case: Publish a Nostr event to the relay.
  This encapsulates the business logic for publishing events.
*/

import Event from '../entities/event.js'
import wlogger from '../adapters/wlogger.js'

class PublishEventUseCase {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error('Adapters instance required')
    }
    if (!this.adapters.nostrRelay) {
      throw new Error('NostrRelay adapter required')
    }
  }

  /**
   * Publish an event to the Nostr relay
   * @param {Object} eventData - Event data (must be signed)
   * @returns {Promise<Object>} Result with accepted status and message
   */
  async execute (eventData) {
    try {
      // Create event entity
      const event = new Event(eventData)

      // Validate event
      if (!event.isValid()) {
        throw new Error('Invalid event structure')
      }

      wlogger.info(`Publishing event ${event.id} (kind ${event.kind})`)

      // Send event to relay
      const result = await this.adapters.nostrRelay.sendEvent(event.toJSON())

      wlogger.info(`Event ${event.id} ${result.accepted ? 'accepted' : 'rejected'}: ${result.message}`)

      return {
        accepted: result.accepted,
        message: result.message || '',
        eventId: event.id
      }
    } catch (err) {
      wlogger.error('Error in PublishEventUseCase:', err)
      throw err
    }
  }
}

export default PublishEventUseCase

