import Reducthor from '../src/Reducthor'
import { Config, Action } from '../src/Reducthor.types'
import axios, { AxiosResponse, AxiosError } from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

beforeEach(() => {
  mock.reset()
})

describe('Reducthor', (): void => {
  describe('Simple Action', () => {
    it('lets an action to simply manipulate the state', (): void => {
      const action: Action = {
        name: 'SIMPLE_ACTION',
        action: (state: any) => {
          return state.set('key', 'value')
        }
      }
      const config: Config = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)

      reducthor.simpleAction()

      const state = reducthor.store.getState()

      expect(state.toJS()).toEqual({ key: 'value' })
    })

    it('lets the user pass any number of args to the action', (): void => {
      const action: Action = {
        name: 'SIMPLE_ACTION',
        type: 'simple',
        action: (state: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('key', 'value')
        }
      }
      const config: Config = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)

      reducthor.simpleAction(10, 'dies')

      const state = reducthor.store.getState()

      expect(state.toJS()).toEqual({ key: 'value' })
    })

    it('returns a promise that resolves when finished and recieve the original args', async () => {
      const action: Action = {
        name: 'SIMPLE_ACTION',
        action: (state: any) => {
          return state.set('key', 'value')
        }
      }
      const config: Config = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)
      let finalResult: any = null

      await reducthor.simpleAction(10, 'dies').then((result: any) => {
        finalResult = result

        // When this happnes the state already change
        const state = reducthor.store.getState()
        expect(state.toJS()).toEqual({ key: 'value' })
      })

      expect(finalResult).toEqual({ args: [10, 'dies'] })
    })

    it('returns a promise that catches any error inside promise', async () => {
      const action: Action = {
        name: 'SIMPLE_ACTION',
        action: (state: any) => {
          return state.error()
        }
      }
      const config: Config = { actions: [action] }
      const reducthor: Reducthor = new Reducthor(config)
      const thenMock: jest.Mock = jest.fn()
      let finalResult: any = null

      await reducthor
        .simpleAction(10, 'dies')
        .then(thenMock)
        .catch((result: any) => {
          finalResult = result

          // When this happnes the state didn't change
          const state = reducthor.store.getState()
          expect(state.toJS()).toEqual({})
        })

      expect(thenMock.mock.calls.length).toEqual(0)
      expect(finalResult).toEqual({ error: TypeError('state.error is not a function'), args: [10, 'dies'] })
    })
  })

  describe('Request action', () => {
    it('lets an action make a remote request and call all the action callbacks at the right time', async () => {
      let eventIndex = 0
      const action: Action = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        onAction: (state: any) => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })

          return state.set('onAction', eventIndex++)
        },
        onRequestOk: (state: any, response: AxiosResponse) => {
          expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })

          return state.set('onRequestOk', eventIndex++).set('data', response.data)
        },
        onUploadProgress: (state: any, progressEvent: any) => {
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onDownloadProgress: (state: any, progressEvent: any) => {
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onFinish: (state: any) => {
          return state.set('onFinish', eventIndex++)
        }
      }

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: Config = {
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

    it('lets the user pass any number of args to the action', async () => {
      let eventIndex = 0
      const action: Action = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        onAction: (state: any, arg1: number, arg2: string) => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onAction', eventIndex++)
        },
        onRequestOk: (state: any, response: AxiosResponse, arg1: number, arg2: string) => {
          expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onRequestOk', eventIndex++).set('data', response.data)
        },
        onUploadProgress: (state: any, progressEvent: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onDownloadProgress: (state: any, progressEvent: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onFinish: (state: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onFinish', eventIndex++)
        }
      }

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: Config = {
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

    it('returns a promise that resolves when finished and recieve the original args', async () => {
      let eventIndex = 0
      const action: Action = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'get',
        onAction: (state: any, arg1: number, arg2: string) => {
          expect(state.toJS()).toEqual({ REQUEST_ACTION_STATUS: 'REQUESTING' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onAction', eventIndex++)
        },
        onRequestOk: (state: any, response: AxiosResponse, arg1: number, arg2: string) => {
          expect(state.toJS()).toEqual({ onAction: 0, REQUEST_ACTION_STATUS: 'OK' })
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onRequestOk', eventIndex++).set('data', response.data)
        },
        onUploadProgress: (state: any, progressEvent: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onDownloadProgress: (state: any, progressEvent: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')
          // Mock does not support progress, lets open a PR
          // return state.set('onUploadProgress', eventIndex++)
          return state
        },
        onFinish: (state: any, arg1: number, arg2: string) => {
          expect(arg1).toEqual(10)
          expect(arg2).toEqual('dies')

          return state.set('onFinish', eventIndex++)
        }
      }
      let finalResult: any = null

      mock.onGet('/path').reply(200, {
        archivos: [{ name: 'trompo.jpg' }]
      })

      const config: Config = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction(10, 'dies').then((result: any) => {
        finalResult = result

        // When this happnes the state already change
        const state = reducthor.store.getState()
        expect(state.toJS()).toEqual({
          onAction: 0,
          onRequestOk: 1,
          onFinish: 2,
          REQUEST_ACTION_STATUS: 'OK',
          data: { archivos: [{ name: 'trompo.jpg' }] }
        })
      })

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

    it('returns a promise that catches any error inside promise', async () => {
      let eventIndex = 0
      const action: Action = {
        name: 'REQUEST_ACTION',
        type: 'request',
        path: '/path',
        method: 'post',
        onRequestError: (state: any, error: AxiosError, arg1: number, arg2: string) => {
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

      const config: Config = {
        actions: [action]
      }
      const reducthor: Reducthor = new Reducthor(config)

      await reducthor.requestAction(10, 'dies').catch((result: any) => {
        finalResult = result

        // When this happens the state already change
        const state = reducthor.store.getState()
        expect(state.toJS()).toEqual({
          onRequestError: 0,
          REQUEST_ACTION_STATUS: 'ERROR',
          error: Error('Request failed with status code 400')
        })
      })

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
  })
})
