/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
import { readFileSync } from 'fs'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const pkgInfo = JSON.parse(readFileSync(`${__dirname.toString()}/../../../package.json`))

const version = pkgInfo.version

export default {
  // Server port
  port: process.env.PORT || 3000,

  // Environment
  env: process.env.NODE_ENV || 'development',

  // Logging level
  logLevel: process.env.LOG_LEVEL || 'info',

  // Nostr relay configuration
  nostrRelayUrl: process.env.NOSTR_RELAY_URL || 'wss://nostr-relay.psfoundation.info',

  // Version
  version
}

