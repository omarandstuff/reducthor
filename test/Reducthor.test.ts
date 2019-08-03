import Reducthor from '../src/Reducthor'
import { ReducthorConfiguration, ReducthorAction } from '../src/Reducthor.types'
import axios, { AxiosResponse, AxiosError } from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { fromJS } from 'immutable'

const mock = new MockAdapter(axios)

beforeEach(
  (): void => {
    mock.reset()
  }
)

describe('Reducthor', (): void => {
  describe('Multiple reducers', (): void => {
    it('lets the user configure multiple reducers', async (): Promise<void> => {
      let eventIndex = 0
      const actions: any = {
        simpleActions: [
          {
            name: 'SIMPLE_ACTION',
            action: (state: any, arg1: number, arg2: string): any => {
              expect(arg1).toEqual(10)
              expect(arg2).toEqual('dies')

              return state.set('key', 'value')
            }
          }
        ],
        requestActions: [
          {
            name: 'REQUEST_ACTION',
            type: 'request',
            path: '/path',
            method: 'get',
            onAction: (state: any, arg1: number, arg2: string): any => {
              expect(arg1).toEqual(10)
              expect(arg2).toEqual('dies')
              expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })

              return state.set('onAction', eventIndex++)
            },
            onRequestOk: (state: any, response: AxiosResponse, arg1: number, arg2: string): any => {
              expect(arg1).toEqual(10)
              expect(arg2).toEqual('dies')
              expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })

              return state.set('onRequestOk', eventIndex++).set('data', response.data)
            },
            onUploadProgress: (state: any, progressEvent: any, arg1: number, arg2: string): any => {
              expect(arg1).toEqual(10)
              expect(arg2).toEqual('dies')
              // Mock does not support progress, lets open a PR
              // return state.set('onUploadProgress', eventIndex++)
              return state
            },
            onDownloadProgress: (state: any, progressEvent: any, arg1: number, arg2: string): any => {
              expect(arg1).toEqual(10)
              expect(arg2).toEqual('dies')
              // Mock does not support progress, lets open a PR
              // return state.set('onUploadProgress', eventIndex++)
              return state
            },
            onFinish: (state: any, arg1: number, arg2: string): any => {
              expect(arg1).toEqual(10)
              expect(arg2).toEqual('dies')
              return state.set('onFinish', eventIndex++)
            }
          }
        ]
      }
      let finalSimpleResult: any = null
      let finalRequestResult: any = null

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: ReducthorConfiguration = {
        actions
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.simpleActions.simpleAction(10, 'dies').then(
        (result: any): void => {
          finalSimpleResult = result

          // When this happens the state already change
          const state = reducthor.store.getState()
          expect(fromJS(state).toJS()).toEqual({ requestActions: {}, simpleActions: { key: 'value' } })
        }
      )
      await reducthor.requestActions.requestAction(10, 'dies').then(
        (result: any): void => {
          finalRequestResult = result

          // When this happens the state already change
          const state = reducthor.store.getState()
          expect(fromJS(state).toJS()).toEqual({
            requestActions: {
              onAction: 0,
              onRequestOk: 1,
              onFinish: 2,
              REQUEST_ACTION_STATUS: 'OK',
              data: { archivos: [{ name: 'trompo.jpg' }] }
            },
            simpleActions: { key: 'value' }
          })
        }
      )

      const state = reducthor.store.getState()
      expect(fromJS(state).toJS()).toEqual({
        requestActions: {
          onAction: 0,
          onRequestOk: 1,
          onFinish: 2,
          REQUEST_ACTION_STATUS: 'OK',
          data: { archivos: [{ name: 'trompo.jpg' }] }
        },
        simpleActions: { key: 'value' }
      })
      expect(finalSimpleResult).toEqual({ args: [10, 'dies'] })
      expect(finalRequestResult).toMatchObject({
        args: [10, 'dies'],
        response: { data: { archivos: [{ name: 'trompo.jpg' }] } }
      })
    })
  })

  describe('Simple ReducthorAction', (): void => {
    it('lets an action to simply manipulate the state', (): void => {
      const action: ReducthorAction = {
        name: 'SIMPLE_ACTION',
        action: (state: any): any => {
          return state.set('key', 'value')
        }
      }
      const config: ReducthorConfiguration = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)

      reducthor.simpleAction()

      const state = reducthor.store.getState()

      expect(state.toJS()).toEqual({ key: 'value' })
    })

    it('lets the user pass any number of args to the action', (): void => {
      const action: ReducthorAction = {
        name: 'SIMPLE_ACTION',
        type: 'simple',
        action: (state: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('key', 'value')
        }
      }
      const config: ReducthorConfiguration = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)

      reducthor.simpleAction(10, 'dies')

      const state = reducthor.store.getState()

      expect(state.toJS()).toEqual({ key: 'value' })
    })

    it('returns a promise that resolves when finished and recieve the original args', async (): Promise<void> => {
      const action: ReducthorAction = {
        name: 'SIMPLE_ACTION',
        action: (state: any): any => {
          return state.set('key', 'value')
        }
      }
      const config: ReducthorConfiguration = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)
      let finalResult: any = null

      await reducthor.simpleAction(10, 'dies').then(
        (result: any): void => {
          finalResult = result

          // When this happens the state already change
          const state = reducthor.store.getState()
          expect(state.toJS()).toEqual({ key: 'value' })
        }
      )

      expect(finalResult).toEqual({ args: [10, 'dies'] })
    })

    it('returns a promise that catches any error inside promise', async (): Promise<void> => {
      const action: ReducthorAction = {
        name: 'SIMPLE_ACTION',
        action: (state: any): any => {
          return state.error()
        }
      }
      const config: ReducthorConfiguration = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)
      const thenMock: jest.Mock = jest.fn()
      let finalResult: any = null

      await reducthor
        .simpleAction(10, 'dies')
        .then(thenMock)
        .catch(
          (result: any): void => {
            finalResult = result

            // When this happens the state didn't change
            const state = reducthor.store.getState()
            expect(state.toJS()).toEqual({})
          }
        )

      expect(thenMock.mock.calls.length).toEqual(0)
      expect(finalResult).toEqual({ error: TypeError('state.error is not a function'), args: [10, 'dies'] })
    })
  })

  describe('Request action', (): void => {
    it('lets an action make a remote request and call all the action callbacks at the right time', async (): Promise<
      void
    > => {
      let eventIndex = 0
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        onAction: (state: any): any => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })

          return state.set('onAction', eventIndex++)
        },
        onRequestOk: (state: any, response: AxiosResponse): any => {
          expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })

          return state.set('onRequestOk', eventIndex++).set('data', response.data)
        },
        onUploadProgress: (state: any, progressEvent: any): any => {
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onDownloadProgress: (state: any, progressEvent: any): any => {
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onFinish: (state: any): any => {
          return state.set('onFinish', eventIndex++)
        }
      }

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: ReducthorConfiguration = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction()

      const state = reducthor.store.getState()
      expect(state.toJS()).toEqual({
        onAction: 0,
        onRequestOk: 1,
        onFinish: 2,
        REQUEST_ACTION_STATUS: 'OK',
        data: { archivos: [{ name: 'trompo.jpg' }] }
      })
    })

    it('lets the user pass any number of args to the action', async (): Promise<any> => {
      let eventIndex = 0
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        onAction: (state: any, arg1: number, arg2: string): any => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onAction', eventIndex++)
        },
        onRequestOk: (state: any, response: AxiosResponse, arg1: number, arg2: string): any => {
          expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onRequestOk', eventIndex++).set('data', response.data)
        },
        onUploadProgress: (state: any, progressEvent: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onDownloadProgress: (state: any, progressEvent: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onFinish: (state: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onFinish', eventIndex++)
        }
      }

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: ReducthorConfiguration = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction(10, 'dies')

      const state = reducthor.store.getState()
      expect(state.toJS()).toEqual({
        onAction: 0,
        onRequestOk: 1,
        onFinish: 2,
        REQUEST_ACTION_STATUS: 'OK',
        data: { archivos: [{ name: 'trompo.jpg' }] }
      })
    })

    it('returns a promise that resolves when finished and recieve the original args', async (): Promise<void> => {
      let eventIndex = 0
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        onAction: (state: any, arg1: number, arg2: string): any => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onAction', eventIndex++)
        },
        onRequestOk: (state: any, response: AxiosResponse, arg1: number, arg2: string): any => {
          expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onRequestOk', eventIndex++).set('data', response.data)
        },
        onUploadProgress: (state: any, progressEvent: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onDownloadProgress: (state: any, progressEvent: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onFinish: (state: any, arg1: number, arg2: string): any => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onFinish', eventIndex++)
        }
      }
      let finalResult: any = null

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: ReducthorConfiguration = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction(10, 'dies').then(
        (result: any): void => {
          finalResult = result

          // When this happens the state already change
          const state = reducthor.store.getState()
          expect(state.toJS()).toEqual({
            onAction: 0,
            onRequestOk: 1,
            onFinish: 2,
            REQUEST_ACTION_STATUS: 'OK',
            data: { archivos: [{ name: 'trompo.jpg' }] }
          })
        }
      )

      const state = reducthor.store.getState()
      expect(state.toJS()).toEqual({
        onAction: 0,
        onRequestOk: 1,
        onFinish: 2,
        REQUEST_ACTION_STATUS: 'OK',
        data: { archivos: [{ name: 'trompo.jpg' }] }
      })
      expect(finalResult).toMatchObject({
        args: [10, 'dies'],
        response: { data: { archivos: [{ name: 'trompo.jpg' }] } }
      })
    })

    it('returns a promise that catches any error inside promise', async (): Promise<void> => {
      let eventIndex = 0
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'post',
        onRequestError: (state: any, error: AxiosError, arg1: number, arg2: string): any => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'ERROR' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onRequestError', eventIndex++).set('error', error)
        }
      }
      let finalResult: any = null

      mock.onPost('/path').reply(400, {
        errores: [{ name: 'is not a name' }]
      })

      const config: ReducthorConfiguration = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction(10, 'dies').catch(
        (result: any): void => {
          finalResult = result

          // When this happens the state already change
          const state = reducthor.store.getState()
          expect(state.toJS()).toEqual({
            onRequestError: 0,
            REQUEST_ACTION_STATUS: 'ERROR',
            error: Error('Request failed with status code 400')
          })
        }
      )

      const state = reducthor.store.getState()
      expect(state.toJS()).toEqual({
        onRequestError: 0,
        REQUEST_ACTION_STATUS: 'ERROR',
        error: Error('Request failed with status code 400')
      })
      expect(finalResult).toEqual({
        args: [10, 'dies'],
        error: Error('Request failed with status code 400')
      })
    })

    it('adds the configured auth headers when a request is private', async (): Promise<void> => {
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        private: true
      }

      mock.onGet('/path').reply(200)

      const config: ReducthorConfiguration = {
        authConfig: {
          header: 'Ultra-Header',
          token: 'thisisatoken'
        },
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction().then(
        (result: any): void => {
          expect(result.response).toMatchObject({
            config: { headers: { 'Ultra-Header': 'thisisatoken' } }
          })
        }
      )
    })

    it('uses a multypart form to send data for post put and patch methods when configured', async (): Promise<void> => {
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'post',
        private: true
      }

      mock.onPost('/path').reply(200)

      const config: ReducthorConfiguration = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction({ data: 'data' }).then(
        (result: any): void => {
          expect(result.response).toMatchObject({
            config: { headers: { 'Content-Type': 'application/json;charset=utf-8' } }
          })
        }
      )

      action.useMultyPartForm = true

      await reducthor.requestAction({ data: 'data' }).then(
        (result: any): void => {
          expect(result.response).toMatchObject({
            config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          })
        }
      )
    })

    describe('dynamic path', (): void => {
      it('builds the path based on the action function call first arguments', async (): Promise<void> => {
        const action: ReducthorAction = {
          name: 'REQUEST_ACTION',
          type: 'request',
          path: '/path/:id/to/:category/items',
          method: 'get'
        }

        mock.onGet().reply(200)

        const config: ReducthorConfiguration = {
          actions: [action]
        }
        const reducthor: Reducthor = new Reducthor(config)

        await reducthor.requestAction(10, 'mostros', { limit: 8 }).then((result: any) => {
          expect(result.response.config).toMatchObject({ url: '/path/10/to/mostros/items', params: { limit: 8 } })
        })
      })

      it('throws and error if there are not enough arguments to build the path', async (): Promise<void> => {
        const action: ReducthorAction = {
          name: 'REQUEST_ACTION',
          type: 'request',
          path: '/path/:id/to/:category/items',
          method: 'get'
        }

        mock.onGet().reply(200)

        const config: ReducthorConfiguration = {
          actions: [action]
        }
        const reducthor: Reducthor = new Reducthor(config)

        reducthor.requestAction(10, { limit: 8 }).catch((result: any) => {
          expect(result).toEqual({
            args: [10, { limit: 8 }],
            error: Error("You didn't provide enough arguments to build /path/:id/to/:category/items")
          })
        })
      })
    })
  })

  describe('.configAuth', (): void => {
    it('lets the user change the auth cpnfiguration at any time', async (): Promise<void> => {
      const action: ReducthorAction = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        private: true
      }

      mock.onGet('/path').reply(200)

      const config: ReducthorConfiguration = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction().then(
        (result: any): void => {
          expect(result.response).toMatchObject({ config: { headers: {} } })
        }
      )

      reducthor.configAuth({ token: 'thisisatoken' })

      await reducthor.requestAction().then(
        (result: any): void => {
          expect(result.response).toMatchObject({ config: { headers: { Authentication: 'thisisatoken' } } })
        }
      )

      reducthor.configAuth({ header: 'Other-Header', token: 'moretoken' })

      await reducthor.requestAction().then(
        (result: any): void => {
          expect(result.response).toMatchObject({ config: { headers: { 'Other-Header': 'moretoken' } } })
        }
      )
    })
  })
})
