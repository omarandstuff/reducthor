<h1 align="center">
  <img src="https://raw.githubusercontent.com/omarandstuff/reducthor/master/media/reducthor-logo.png" alt="Reducthor" title="Reducthor" width="512">
</h1>

[![npm version](https://badge.fury.io/js/reducthor.svg)](https://www.npmjs.com/package/reducthor)
[![Build Status](https://travis-ci.org/omarandstuff/reducthor.svg?branch=master)](https://travis-ci.org/omarandstuff/reducthor)
[![Maintainability](https://api.codeclimate.com/v1/badges/f7a4eaeaeaffb4327a8e/maintainability)](https://codeclimate.com/github/omarandstuff/reducthor/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/f7a4eaeaeaffb4327a8e/test_coverage)](https://codeclimate.com/github/omarandstuff/reducthor/test_coverage)

Reducthor is a clean simplification of the redux workflow. By letting you describe readable action objects.

Reduxthor uses [axios](https://github.com/axios/axios) as the remote request handler and [Immutbale JS](https://github.com/immutable-js/immutable-js) to have an immutable state.

## Install

```sh
npm install reducthor

yarn add reducthor
```

## Getting staterd

A new instalnce of reducthor should be instantiated at the beggining, passong a configuraion object containing our action descriptiors.

This is how a simple action looks like

```js
// actions/setColor.js

export default {
  name: 'SET_COLOR',
  action: (state, color) => {
    return state.set('color', color)
  }
}
```

Typescript:

```ts
// actions/setColor.ts

import { ReducthorAction } from 'reducthor'

const action: ReducthorAction = {
  name: 'SET_COLOR',
  action: (state: any, color: srtring) => {
    return state.set('color', color)
  }
}

export default action
```

And this is how we can configure our Reducthor instance using this action

```js
// reducthor.js

import Reducthor from 'reducthor'
import setColor from './actions/setColor'
import otherAction from './actions/otherAction'

const configuration = {
  actions: [setColor, otherAction]
}

const reducthor = new Reducthor(configuration)

export default reducthor
```

Typescript:

```js
// reducthor.ts

import Reducthor, { ReducthorConfiguration, ReducthorInstance } from 'reducthor'
import setColor from './actions/setColor'
import otherAction from './actions/otherAction'

const configuration: ReducthorConfiguration = {
  actions: [setColor, otherAction]
}

const reducthor: ReducthorInstance = new Reducthor(configuration)

export default reducthor
```

And this is how you can call that action from our reducthor object to mutate the state.

```js
// index.js

import reducthor from './reducthor'

// This method was generated based on the configured action name 'SET_COLOR' -> 'setColor'
reducthor.setColor('red').then(() => {
  // All actions in a reducthor are thenables

  console.log(reducthor.store.getState())
  // Map { color: 'red' }
})
```

## Request actions

This is a really useful type of action, it will perform a request to the specified path, method and params and then let us use the response to mutate our state.

Lets get a list of posts

```js
// actions/getPosts.js

import Immutable from 'immutable'

export default {
  name: 'GET_POSTS',
  type: 'request',
  path: '/posts',
  method: 'get',
  onRequestOk: (state, response) => {
    const posts = response.data

    return state.set('posts', Immutable.fromJS(posts))
  }
}
```

Typescript:

```ts
// actions/getPosts.ts

import { ReducthorAction } from 'reducthor'
import Immutable from 'immutable'
import { AxiosResponse } from 'axios'

const action: ReducthorAction = {
  name: 'GET_POSTS',
  type: 'request',
  path: '/posts',
  method: 'get',
  onRequestOk: (state: any, response: AxiosResponse) => {
    const posts = response.data

    return state.set('posts', Immutable.fromJS(posts))
  }
}

export default action
```

We can configure a base URL in our rethuctor object.

```js
// reducthor.js

import Reducthor from 'reducthor'
import getPosts from './actions/getPosts'

const configuration = {
  baseURL: 'api.postworld.com',
  actions: [getPosts]
}

const reducthor = new Reducthor(configuration)

export default reducthor
```

Typescript:

```js
// reducthor.ts

import Reducthor, { ReducthorConfiguration, ReducthorInstance } from 'reducthor'
import getPosts from './actions/getPosts'

const configuration: ReducthorConfiguration = {
  baseURL: 'api.postworld.com',
  actions: [getPosts]
}

const reducthor: ReducthorInstance = new Reducthor(configuration)

export default reducthor
```

Now we call the request action through our reducthor instance and since we specified the `mehtod` as `get` we can pass some query params as the first argument of the generated function.

```js
// index.js

import reducthor from './reducthor'

reducthor.getPosts({ category: 'funy' }).then(() => {
  console.log(reducthor.store.getState())
  // Map { GET_POSTS_STATUS: 'OK', posts: [...] }
})
```

### All the request action callbacks

The request action has several usefull callbacks for every event the request is coming through where we can mutate the state as our convenience.

```js
// actions/getPosts.js

import Immutable from 'immutable'

export default {
  name: 'GET_POSTS',
  type: 'request',
  path: '/posts',
  method: 'get',
  onAction: state => satate, // At the moment you call the action from the reducthor object
  onRequestOk: (state, response) => state, // The request was successful,
  onRequestError: (state, error) => state, // The request return with some error status number
  onUploadProgress: (state, progressEvent) => state, // axios can provide this event sometimes
  onDownloadProgress: (state, progressEvent) => state, // axios can provide this event sometimes
  onFinish: state => satate // This happens at last either with a successfull request or not
}
```

Typescript:

```ts
// actions/getPosts.ts

import { ReducthorAction } from 'reducthor'
import Immutable from 'immutable'
import { AxiosResponse } from 'axios'

const action: ReducthorAction = {
  name: 'GET_POSTS',
  type: 'request',
  path: '/posts',
  method: 'get',
  onRequestOk: (state: any, response: AxiosResponse) => {
    const posts = response.data

    return state.set('posts', Immutable.fromJS(posts))
  }
}

export default action
```

### Dynamic path

You can specify dynamic paths that should by constructed on the fly. Like probably you need the path to contain the id of the posts you would like to request.

```js
// actions/getPost.js

import Immutable from 'immutable'

export default {
  name: 'GET_POST',
  type: 'request',
  path: '/post/:id', // the id will be set from the action call
  method: 'get',
  onRequestOk: (state, response) => {
    const posts = response.data

    return state.set('posts', Immutable.fromJS(posts))
  }
}
```

```js
// index.js

import reducthor from './reducthor'

// The first variable in the path is the first argument in the call
reducthor.getPost(25).then(() => {
  console.log(reducthor.store.getState())
  // Map { GET_POSTS_STATUS: 'OK', posts: { 25: {...} } }
})
```

### Private request actions

If the remote server needs some kind of authentication through request headers you can set the auth configuration.

```js
// reducthor.js

import Reducthor from 'reducthor'
import getPosts from './actions/getPosts'

const configuration = {
  baseURL: 'api.postworld.com',
  authConfig: {
    header: 'Authentication', // It can be any header you want default is 'Authentication'
    token: 'sometoken'
  },
  actions: [getPosts]
}

const reducthor = new Reducthor(configuration)

export default reducthor
```

Just set the action as `private` to use the header in the request

```js
// actions/getPost.js

import Immutable from 'immutable'

export default {
  name: 'GET_POST',
  type: 'request',
  path: '/post/:id',
  method: 'get',
  private: true,
  onRequestOk: (state, response) => {
    const posts = response.data

    return state.set('posts', Immutable.fromJS(posts))
  }
}
```

#### Set the auth configuration any time

If you need to specify authentication at any point you can use the `configureAuth` method.

```js
// index.js

import reducthor from './reducthor'

reducthor.configureAuth({ token: 'newtoken' })
```

## Using with react-redux

If you are using react-redux to handle state from inside components you can use Reducthor to replace the mapToDispatch approach.

Just set the provider store using the reacthor store

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import reducthor from './reducthor'

import App from './App'

const rootElement = document.getElementById('root')
ReactDOM.render(
  <Provider store={reducthor.store}>
    <App />
  </Provider>,
  rootElement
)
```

And connect your components as you wold normally do

```js
import { connect } from 'react-redux'
import reducthor from './reducthor'

export default class Counter extends Component {

  handleButtonUp(e) {
    reducthor.increment()
  }

  //...
}

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    counter: state.counter
  }
}

export default connect(mapStateToProps)(Counter)
```

## Use a multy reducer store

If you like to use a multy reducer kind of store you can specify actions in the configuration to follow this pattern.

```js
// reducthor.js

import Reducthor from 'reducthor'
import getPosts from './actions/getPosts'
import getUsers from './actions/getUsers'

const configuration = {
  baseURL: 'api.postworld.com',
  actions: { posts: [getPosts], users: [getUsers] }
}

const reducthor = new Reducthor(configuration)

export default reducthor
```

Now action calls are separated by reducer "namespaces"

```js
// index.js

import reducthor from './reducthor'

reducthor.posts.getPosts({ category: 'funy' })
reducthor.users.getUsers({ status: 'active' })
```

## Initial state and middleware

You can always pass an inital state through the Reducthor configuration and some custom middleware

```js
// reducthor.js

import Reducthor from 'reducthor'
import getPosts from './actions/getPosts'
import Immutable from 'immutable'

const configuration = {
  baseURL: 'api.postworld.com',
  initialState: Immutable.fromJS({ posts: [...] }),
  middleware: [customMiddleware, customMiddleware2],
  actions:  [getPosts]
}

const reducthor = new Reducthor(configuration)

export default reducthor
```

## Use with redux-devtools-extension

If you would like to use redux-devtools-extension to debugg your redux state you can pass the composeWithDevTools function to through the configuration.

```js
// reducthor.js

import Reducthor from 'reducthor'
import getPosts from './actions/getPosts'
import { composeWithDevTools } from 'redux-devtools-extension'

const configuration = {
  baseURL: 'api.postworld.com',
  composeWithDevTools: composeWithDevTools,
  actions: [getPosts]
}

const reducthor = new Reducthor(configuration)

export default reducthor
```

## Contributions

PRs are welcome

## Lisence

MIT
