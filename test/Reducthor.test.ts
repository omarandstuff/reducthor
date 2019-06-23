import Reducthor from '../src/Reducthor'
import { Config, Action } from '../src/Reducthor.types'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

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
    // it('Let an action make a remote quest and ', (): void => {
    //   const action: Action = {
    //     name: 'SIMPLE_ACTION',
    //     action: (state: any) => {
    //       return state.set('key', 'value')
    //     }
    //   }
    //   const config: Config = { actions: [action] }
    //   const reducthor: Reducthor = new Reducthor(config)
    //   reducthor.simpleAction()
    //   const state = reducthor.store.getState()
    //   expect(state.toJS()).toEqual({ key: 'value' })
    // })
  })
})
