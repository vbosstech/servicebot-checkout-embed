import React, { Component } from 'react';
import './App.css';
import ServicebotManage from "./forms/management-form.jsx"
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
      let Component;
      switch(this.props.config.type){
          case "request":
              Component = ServicebotRequest;
              break;
          case "manage" :
              Component = ServicebotManage;
              break;
          default:
              Component = ServicebotRequest;
      }
      return (
      <div className="App">
      <Provider store={store}>
          <Component {...this.props.config}/>
        </Provider>
      </div>
    );
  }
}

export default App;
