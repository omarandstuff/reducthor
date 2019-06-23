import Reduxer from '../src/Reduxer'
import { Config, Action } from '../src/Reduxer.types'

describe('Reduxer', (): void => {
  describe('Simple Action', () => {
    it('Let an action to simply manipulate the state', (): void => {
      const action: Action = {
        name: 'SIMPLE_ACTION',
        action: (state: any) => {
          return state.set('key', 'value')
        }
      }
      const config: Config = { actions: [action] }
      const reduxer: Reduxer = new Reduxer(config)

      reduxer.simpleAction()

      const state = reduxer.store.getState()

      expect(state.toJS()).toEqual({ key: 'value' })
    })
  })
})
