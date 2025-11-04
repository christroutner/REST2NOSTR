/*
  This is a top-level library that encapsulates all the additional Adapters.
  The concept of Adapters comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Load individual adapter libraries.
import NostrRelayAdapter from './nostr-relay.js'
import config from '../config/index.js'

class Adapters {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.config = config
    this.nostrRelay = new NostrRelayAdapter({
      relayUrl: localConfig.relayUrl || config.nostrRelayUrl
    })
  }

  async start () {
    try {
      // Connect to Nostr relay
      await this.nostrRelay.connect()
      console.log('Nostr relay adapter started.')

      return true
    } catch (err) {
      console.error('Error in adapters/index.js/start()')
      throw err
    }
  }
}

export default Adapters
