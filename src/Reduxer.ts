import { applyMiddleware, combineReducers, createStore, Reducer, Store, ReducersMapObject } from 'redux'
import { Configuration } from './Reduxer.types'
import thunk from 'redux-thunk'

/**
 * Reduxer will take care of automatic reducer creation that handles "standard"
 * store tasks, like fetch and object form an API, a list of objects, or the
 * system state.
 *
 * It can also provide an encapsulated way of managing custom reducers (IDEA)
 *
 * @param {Configuration} configuration of how reduxer will handle actions
 *
 */
export default class Reduxer {
  public store: Store = null

  private configuration: Configuration = null

  public constructor(configuation: Configuration) {
    this.configuration = configuation
  }
}
