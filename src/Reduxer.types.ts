import { StoreEnhancer, Reducer } from 'redux'

export interface NameSpace {
  name: string
}

export interface ReduxerConfig {
  nameSpaces: NameSpace[]
}

export interface ReduxConfig {
  reducer: Reducer | Reducer[]
  initialState: object
  middleware: StoreEnhancer
}
