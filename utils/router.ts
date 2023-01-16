import * as FMWRouter from 'find-my-way'

import type { ExpectInterface } from '@pubnub/tomato'

type RouteHandler = (
  req: {
    method: string
    body?: any
    headers: Record<string, any>
    url: { path: string; query: Record<string, string> }
  },
  params?: Record<string, any>
) =>
  | Promise<{
      status: number
      headers?: Record<string, any>
      body?: any
    }>
  | {
      status: number
      headers?: Record<string, any>
      body?: any
    }

type Routes = {
  [k: string]: RouteHandler
}

export class Router {
  private _fwm: FMWRouter.Instance<FMWRouter.HTTPVersion.V1>
  private routes: Record<string, RouteHandler> = {}

  constructor(private expect: ExpectInterface) {
    this._fwm = FMWRouter()
  }

  get(path: string, handler: RouteHandler) {
    this.routes[`GET ${path}`] = handler
  }

  post(path: string, handler: RouteHandler) {
    this.routes[`POST ${path}`] = handler
  }

  async run() {
    for (const [key, handler] of Object.entries(this.routes)) {
      const [method, path] = key.split(' ')

      this._fwm.on(
        method.toUpperCase() as FMWRouter.HTTPMethod,
        path,
        handler as any
      )
    }

    console.log('running')

    while (true) {
      const request = await this.expect({
        description: 'any request',
        validations: [],
      })

      const route = this._fwm.find(
        request.method.toUpperCase() as FMWRouter.HTTPMethod,
        request.url.path
      )

      if (!route) {
        await request.respond({ status: 404 })
      } else {
        const response = await (route.handler as RouteHandler)(
          request,
          route.params
        )

        await request.respond({
          status: response?.status,
          headers: response?.headers,
          body: response?.body,
        })
      }
    }
  }
}
