import { applyMiddleware, combineReducers, createStore, Reducer, ReducersMapObject, AnyAction, Dispatch } from 'redux'
import { ReducthorAction, AuthConfig, ReducthorConfiguration } from './Reducthor.types'
import thunk from 'redux-thunk'
import { Map } from 'immutable'
import axios, { AxiosError, AxiosResponse } from 'axios'

/**
 * Reducthor will take care of automatic reducer creation that handles "standard"
 * store tasks, like make a request type action or a simple store manipulation
 *
 * @param {ReducthorConfiguration} config of how reducthor will handle actions
 *
 */
export default class Reducthor {
  // Reducthor will generate attributes on the fly so we need to make sure it does not conflic
  // with typescript, maybe at some ponint retypy the reducthor class?
  [key: string]: any

  // TODO: thunk actions have a problem with the Sore type since it expects only a plane ReducthorAction
  public store: any = null

  private actions: ((state: any, ...args: any[]) => any)[] = []
  private config: ReducthorConfiguration = null

  public constructor(config: ReducthorConfiguration) {
    this.config = config

    // If actions is just and array the we just create a reducer that handles all actions
    // if not then is probably an object that separates actions into reducers, in that case
    // we create reducers that handle thes specified actions.
    const simple: boolean = Object.prototype.toString.call(config.actions) === '[object Array]'
    const generatedReducers: Reducer = this.generateReducers(config.actions, simple)

    // If composeWithDevTools is proveded we apply thunk and the provided middleware inside it or
    // we just apply it as normal. check https://github.com/zalmoxisus/redux-devtools-extension
    const finalMiddleWare = config.composeWithDevTools
      ? config.composeWithDevTools(applyMiddleware(thunk, ...(config.middleware || [])))
      : applyMiddleware(thunk, ...(config.middleware || []))

    // Create the store as normally if an initial state is provided then just use that if not check if actios
    // are simple; in that case we initialize it as an Immutable Map and if not we just pass an empty object that
    // redux wll reshape into one with all the reducthor namespaces.
    this.store = createStore(generatedReducers, config.initialState || (simple ? Map() : {}), finalMiddleWare)
  }

  /**
   * In any time the user can reconfigure how reducthor will use an auth token when a request
   * action has been called
   *
   * @param {AuthConfig} authConfig the new auth configuration to use
   *
   */
  public configAuth(authConfig: AuthConfig): void {
    if (this.config.authConfig) {
      this.config.authConfig = { ...this.config.authConfig, ...authConfig }
    } else {
      this.config.authConfig = authConfig
    }
  }

  private generateReducers(actions: any, simple: boolean): Reducer {
    if (simple) {
      actions.forEach(
        (action: ReducthorAction): void => {
          if (action.type === 'request') {
            const derivedActionNames: any = this.generateDerivedActionsNames(action.name)

            this.generateRequestActions(action, derivedActionNames)
            this.generateRequestMainAction(action, derivedActionNames)
          } else if (!action.type || action.type === 'simple') {
            this.generateSimpleAction(action)
            this.generateSimpleMainAction(action)
          }
        }
      )

      // Behold the one reducer function
      return (state: any, action: AnyAction): any => {
        // Reducthor actions use "type" to distinguish them, but in the reduzer
        // actions are sored by the ReducthorAction name
        if (this.actions[action.type]) {
          // actions always pass an array of aprams as payload
          return this.actions[action.type].apply(null, [state, ...action.args])
        } else {
          return state
        }
      }
    } else {
      const reducers: ReducersMapObject = {}

      Object.keys(actions).forEach(
        (reducerNameSpace: string): void => {
          // Now the reducthor object has some how "namespaces" based on the reducers
          this[reducerNameSpace] = {}
          this.actions[reducerNameSpace] = {}

          actions[reducerNameSpace].forEach(
            (action: ReducthorAction): void => {
              if (action.type === 'request') {
                const derivedActionNames: any = this.generateDerivedActionsNames(action.name)

                this.generateRequestActions(action, derivedActionNames, reducerNameSpace)
                this.generateRequestMainAction(action, derivedActionNames, reducerNameSpace)
              } else if (!action.type || action.type === 'simple') {
                this.generateSimpleAction(action, reducerNameSpace)
                this.generateSimpleMainAction(action, reducerNameSpace)
              }
            }
          )

          // Behold the one reducer function for this "namespace"
          reducers[reducerNameSpace] = (state: any = Map(), action: AnyAction): any => {
            if (this.actions[reducerNameSpace][action.type]) {
              return this.actions[reducerNameSpace][action.type].apply(null, [state, ...action.args])
            } else {
              return state
            }
          }
        }
      )

      return combineReducers(reducers)
    }
  }

  private generateDerivedActionsNames(actionName: string): any {
    return {
      functionName: actionName.toLowerCase().replace(/_([a-z])/g, (g): string => g[1].toUpperCase()),
      setRequestingActionName: `${actionName}_SET_REQUESTING`,
      uploadProgressActionName: `${actionName}_UPLOAD_PROGRESS`,
      downloadProgressActionName: `${actionName}_DOWNLOAD_PROGRESS`,
      requestOkActionName: `${actionName}_REQUEST_OK`,
      requestErrorActionName: `${actionName}_REQUEST_ERROR`,
      finishedActionName: `${actionName}_FINISHED`
    }
  }

  private generateRequestActions(action: ReducthorAction, derivedActionNames: any, reducerNameSpace: string = undefined): void {
    const actions = reducerNameSpace ? this.actions[reducerNameSpace] : this.actions

    // Before sending the request if set a status flag that shows that we are doing it
    actions[derivedActionNames.setRequestingActionName] = (state: any, ...args: any[]): any => {
      const statusedState: any = state.set(`${action.name}_STATUS`, 'REQUESTING')

      // And let the user set anything afterwards
      if (action.onAction) {
        return action.onAction(statusedState, ...args)
      } else {
        return statusedState
      }
    }

    actions[derivedActionNames.uploadProgressActionName] = (state: any, ...args: any[]): any => {
      if (action.onUploadProgress) {
        const progressEvent: any = args.shift()

        return action.onUploadProgress(state, progressEvent, ...args)
      } else {
        return state
      }
    }

    actions[derivedActionNames.downloadProgressActionName] = (state: any, ...args: any[]): any => {
      if (action.onDownloadProgress) {
        const progressEvent: any = args.shift()

        return action.onDownloadProgress(state, progressEvent, ...args)
      } else {
        return state
      }
    }

    // If the request has an ok status we set the flag as ok
    actions[derivedActionNames.requestOkActionName] = (state: any, ...args: any[]): any => {
      const statusedState = state.set(`${action.name}_STATUS`, 'OK')

      if (action.onRequestOk) {
        const response: AxiosResponse = args.shift()

        return action.onRequestOk(statusedState, response, ...args)
      } else {
        return statusedState
      }
    }

    // Set error flag if not ok
    actions[derivedActionNames.requestErrorActionName] = (state: any, ...args: any[]): any => {
      const statusedState = state.set(`${action.name}_STATUS`, 'ERROR')

      if (action.onRequestError) {
        const error: AxiosError = args.shift()

        return action.onRequestError(statusedState, error, ...args)
      } else {
        return statusedState
      }
    }

    actions[derivedActionNames.finishedActionName] = (state: any, ...args: any[]): any => {
      if (action.onFinish) {
        return action.onFinish(state, ...args)
      } else {
        return state
      }
    }
  }

  private generateRequestMainAction(
    action: ReducthorAction,
    derivedActionNames: any,
    reducerNameSpace: string = undefined
  ): void {
    const holder = reducerNameSpace ? this[reducerNameSpace] : this

    holder[derivedActionNames.functionName] = (...args: any[]): Promise<any> => {
      return this.store.dispatch(
        (dispatch: Dispatch): Promise<any> => {
          return new Promise(
            (resolve, reject): void => {
              // Tell the store we are requesting
              dispatch({ type: derivedActionNames.setRequestingActionName, args })

              const data = args[0]
              const headers = {}
              let form = data
              let params = {}

              // Always use form for POST PATH AND PUT requests
              if (data && ['post', 'patch', 'put'].includes(action.method)) {
                form = new FormData()

                Object.keys(data).forEach(
                  (filedName: string): void => {
                    form.append(filedName, data[filedName])
                  }
                )
              } else {
                params = data
              }

              if (action.private && this.config.authConfig) {
                headers[this.config.authConfig.header || 'Authentication'] = this.config.authConfig.token
              }

              axios({
                baseURL: this.config.baseUrl,
                method: action.method,
                url: action.path,
                data: form,
                params,
                headers,
                onUploadProgress: function(progressEvent): void {
                  dispatch({ type: derivedActionNames.uploadProgressActionName, args: [progressEvent, ...args] })
                },
                onDownloadProgress: function(progressEvent): void {
                  dispatch({ type: derivedActionNames.downloadProgressActionName, args: [progressEvent, ...args] })
                }
              })
                .then(
                  (response: AxiosResponse): void => {
                    dispatch({ type: derivedActionNames.requestOkActionName, args: [response, ...args] })
                    dispatch({ type: derivedActionNames.finishedActionName, args })
                    resolve({ response, args })
                  }
                )
                .catch(
                  (error: AxiosError): void => {
                    dispatch({ type: derivedActionNames.requestErrorActionName, args: [error, ...args] })
                    dispatch({ type: derivedActionNames.finishedActionName, args })
                    reject({ error, args })
                  }
                )
            }
          )
        }
      )
    }
  }

  private generateSimpleAction(action: ReducthorAction, reducerNameSpace: string = undefined): void {
    const actions = reducerNameSpace ? this.actions[reducerNameSpace] : this.actions

    actions[action.name] = (state: any, ...args: any[]): any => {
      if (action.action) {
        return action.action(state, ...args)
      } else {
        return state
      }
    }
  }

  private generateSimpleMainAction(action: ReducthorAction, reducerNameSpace: string = undefined): void {
    const functionName = action.name.toLowerCase().replace(/_([a-z])/g, (g): string => g[1].toUpperCase())
    const holder = reducerNameSpace ? this[reducerNameSpace] : this

    holder[functionName] = (...args: any[]): Promise<any> => {
      return this.store.dispatch(
        (dispatch: Dispatch): Promise<any> => {
          return new Promise(
            (resolve, reject): void => {
              try {
                dispatch({ type: action.name, args })
                resolve({ args })
              } catch (error) {
                reject({ error, args })
              }
            }
          )
        }
      )
    }
  }
}
