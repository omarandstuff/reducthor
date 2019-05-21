import { ThunkAction } from 'redux-thunk'
import { Action, Dispatch } from 'redux'

export function load(state: any, id: number, params: object = {}): ThunkAction<void, any, null, Action<string>> {
  return (dispatch: Dispatch, getState) => {
    return state
  }
}
