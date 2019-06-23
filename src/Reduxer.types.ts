import { StoreEnhancer, Reducer } from 'redux'

export interface Configuration {
  initialState: object
  middleware: StoreEnhancer
}
