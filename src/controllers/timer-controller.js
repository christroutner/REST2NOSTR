/*
  Timer-based controller functions.
  This controller handles scheduled tasks and timers.
*/

// Local libraries
import wlogger from '../adapters/wlogger.js'

class TimerController {
  constructor (localConfig = {}) {
    // Dependency Injection
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating TimerController.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating TimerController.'
      )
    }

    // Constants
    this.SHUTDOWN_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

    // Handlers
    this.shutdownHandler = null

    // Bind 'this' object to all subfunctions
    this.startTimerControllers = this.startTimerControllers.bind(this)
    this.stopTimerControllers = this.stopTimerControllers.bind(this)
    this.shutdown = this.shutdown.bind(this)
  }

  startTimerControllers () {
    console.log('Starting Timer Controllers.')

    this.shutdownHandler = setInterval(() => {
      this.shutdown()
    }, this.SHUTDOWN_INTERVAL_MS)
  }

  stopTimerControllers () {
    console.log('Stopping Timer Controllers.')

    clearInterval(this.shutdownHandler)
    this.shutdownHandler = null
  }

  // Execute the shutdown callback
  shutdown () {
    wlogger.info(`TimerController: Shutting down application at ${new Date().toISOString()}, depending on process manager to restart application.`)
    process.exit(1)
  }
}

export default TimerController
