import Reduxer from '../src/Reduxer'

describe('Reduxer', (): void => {
  it('creates a store at initializing', (): void => {
    const reduxer: Reduxer = new Reduxer({nameSpaces: [{name: 'messages'}]})

    expect(reduxer.store).not.toBeNull()
  })
})
