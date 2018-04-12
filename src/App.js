import React, { Component } from 'react';
import './App.css';
import ServicebotRequest from "./service-request.jsx"
import { Provider } from 'react-redux'
import { createStore, combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'

class App extends Component {
  render() {

      const options = (state = {currency : {value : "usd"}}, action) => {
          switch (action.type) {
              case 'SET_CURRENCY':
                  return action.filter
              default:
                  return state
          }
      }


      let store = createStore(combineReducers({
          options,
          form : formReducer,
      }));

      return (
      <div className="App">
      <Provider store={store}>
        <ServicebotRequest {...this.props.config}/>
        </Provider>
      </div>
    );
  }
}

export default App;
