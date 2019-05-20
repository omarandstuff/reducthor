import { combineReducers, createStore, Reducer, Store, ReducersMapObject } from 'redux'
import { NameSpace, ReduxerConfig, ReduxConfig } from './Reduxer.types'

/**
 * Defaul redux config is empty, the user can use this to initialize the store,
 * use custom reducers and middleware.
 */
const defaultReduxConfig: ReduxConfig = {
  reducer: undefined,
  initialState: undefined,
  middleware: undefined
}

/**
 * Reduxer will take care of automatic reducer creation that handles "standard"
 * store tasks, like fetch and object form an API, a list of objects, or the
 * system state.
 *
 * It can also provide an encapsulated way of managing custom reducers (IDEA)
 *
 * @param {ReduxerConfig} reduxerConfig description of the automatic name spaces
 * to be handles
 *
 * @param {ReduxConfig} [reduxConfig] The user can pass direct redux configuration
 * through this object
 *
 */
export default class Reduxer {
  public store: Store = null

  public constructor(reduxerConfig: ReduxerConfig, reduxConfig: ReduxConfig = defaultReduxConfig) {
    const generatedReducers: Reducer = this.generateReducers(reduxerConfig.nameSpaces)

    this.store = createStore(generatedReducers, reduxConfig.initialState, reduxConfig.middleware)
  }

  private generateReducers(nameSpaces: NameSpace[]): Reducer {
    const reducers: ReducersMapObject = nameSpaces.reduce((generated, nameSpace: NameSpace) => {
      generated[nameSpace.name] = this.createReducerNameSpace(nameSpace)
      return generated
    }, {})

    return combineReducers(reducers)
  }

  private createReducerNameSpace(nameSpace: NameSpace) {
    return (state = {}, action) => {
      switch (action.type) {
        default:
          return state
      }
    }
  }
}
