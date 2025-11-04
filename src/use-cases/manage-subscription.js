/*
  Use case: Manage subscriptions for Server-Sent Events (SSE).
  This encapsulates the business logic for creating and managing subscriptions.
*/

import wlogger from '../adapters/wlogger.js'

class ManageSubscriptionUseCase {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error('Adapters instance required')
    }
    if (!this.adapters.nostrRelay) {
      throw new Error('NostrRelay adapter required')
    }
    this.activeSubscriptions = new Map() // Map subscriptionId to handlers
  }

  /**
   * Create a subscription for SSE streaming
   * @param {string} subscriptionId - Unique subscription ID
   * @param {Array} filters - Array of filter objects
   * @param {Function} onEvent - Callback for events
   * @param {Function} onEose - Callback for EOSE
   * @param {Function} onClosed - Callback for CLOSED
   * @returns {Promise<void>}
   */
  async createSubscription (subscriptionId, filters, onEvent, onEose, onClosed) {
    try {
      if (this.activeSubscriptions.has(subscriptionId)) {
        throw new Error(`Subscription ${subscriptionId} already exists`)
      }

      wlogger.info(`Creating subscription ${subscriptionId}`)

      const handlers = {
        onEvent: (event) => {
          if (onEvent) {
            onEvent(event)
          }
        },
        onEose: () => {
          if (onEose) {
            onEose()
          }
        },
        onClosed: (message) => {
          if (onClosed) {
            onClosed(message)
          }
          // Clean up subscription
          this.activeSubscriptions.delete(subscriptionId)
        }
      }

      this.activeSubscriptions.set(subscriptionId, handlers)

      // Send REQ message
      await this.adapters.nostrRelay.sendReq(subscriptionId, filters, handlers)
    } catch (err) {
      wlogger.error('Error creating subscription:', err)
      this.activeSubscriptions.delete(subscriptionId)
      throw err
    }
  }

  /**
   * Close a subscription
   * @param {string} subscriptionId - Subscription ID to close
   * @returns {Promise<void>}
   */
  async closeSubscription (subscriptionId) {
    try {
      if (!this.activeSubscriptions.has(subscriptionId)) {
        throw new Error(`Subscription ${subscriptionId} not found`)
      }

      wlogger.info(`Closing subscription ${subscriptionId}`)

      await this.adapters.nostrRelay.sendClose(subscriptionId)
      this.activeSubscriptions.delete(subscriptionId)
    } catch (err) {
      wlogger.error('Error closing subscription:', err)
      // Clean up even if there's an error
      this.activeSubscriptions.delete(subscriptionId)
      throw err
    }
  }

  /**
   * Check if a subscription exists
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean}
   */
  hasSubscription (subscriptionId) {
    return this.activeSubscriptions.has(subscriptionId)
  }
}

export default ManageSubscriptionUseCase
