/*
  Use case: Query events from the relay (stateless).
  This encapsulates the business logic for querying events.
*/

import wlogger from '../adapters/wlogger.js'

class QueryEventsUseCase {
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
   * Query events with filters (stateless - returns immediately)
   * @param {Array} filters - Array of filter objects
   * @param {string} subscriptionId - Unique subscription ID
   * @returns {Promise<Array>} Array of events
   */
  async execute (filters, subscriptionId) {
    try {
      wlogger.info(`Querying events with subscription ${subscriptionId}`)

      const events = []
      const status = {
        eoseReceived: false,
        closedReceived: false,
        closedMessage: ''
      }

      // Create handlers for this query
      const handlers = {
        onEvent: (event) => {
          events.push(event)
        },
        onEose: () => {
          status.eoseReceived = true
        },
        onClosed: (message) => {
          status.closedReceived = true
          status.closedMessage = message
        }
      }

      // Send REQ message
      await this.adapters.nostrRelay.sendReq(subscriptionId, filters, handlers)

      // Wait for EOSE or CLOSED
      const timeout = 30000 // 30 seconds
      const startTime = Date.now()

      while (!status.eoseReceived && !status.closedReceived && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Clean up subscription
      try {
        await this.adapters.nostrRelay.sendClose(subscriptionId)
      } catch (err) {
        wlogger.warn('Error closing subscription:', err)
      }

      if (status.closedReceived) {
        throw new Error(`Subscription closed: ${status.closedMessage}`)
      }

      if (!status.eoseReceived) {
        wlogger.warn('EOSE not received within timeout')
      }

      wlogger.info(`Query returned ${events.length} events`)
      return events
    } catch (err) {
      wlogger.error('Error in QueryEventsUseCase:', err)
      throw err
    }
  }
}

export default QueryEventsUseCase
