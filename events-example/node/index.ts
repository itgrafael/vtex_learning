import {
  Service,
  ParamsContext,
  ServiceContext,
  RecorderState,
  ClientsConfig,
} from '@vtex/api'
import { Clients } from './clients'
import { example } from './events/example'
import { createSendEvent } from './routes/notify'
import { getCacheContext, setCacheContext } from './utils/cachedContext'
import { analytics } from './handlers/analytics'
const TREE_SECONDS_MS = 3 * 1000
const CONCURRENCY = 10

declare global {
  type Context = ServiceContext<Clients, State>

  interface State extends RecorderState {
    code: number
  }
}

function sendEventWithTimer() {
  setInterval(function () {
    const context = getCacheContext()
    if (!context) {
      console.log('no context in memory')
      return
    }
    return createSendEvent(context)
  }, 30000)
  console.log('FIRED HERE')
}

sendEventWithTimer()


const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: 2000,
    },
    events: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 50,
      retries: 1,
      timeout: TREE_SECONDS_MS,
      concurrency: CONCURRENCY,
    },
  },
}


export default new Service<Clients, State, ParamsContext>({
  clients,
  events: {
    example
  },
  routes: {
    hcheck: (ctx: Context) => {
      setCacheContext(ctx)
      ctx.set('Cache-Control', 'no-cache')
      ctx.status = 200
      ctx.body = 'ok'
    },
    analytics
  },
})
