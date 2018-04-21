import React, { Component } from 'react';
// import './App.css';
import ServicebotManage from "./forms/management-form.jsx"
import ServicebotRequest from "./service-request.jsx"

import { Provider } from 'react-redux'
import { createStore, combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'
import Load from "./utilities/load.jsx"
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
      const loadingReducer = (state = false, action) => {
          switch(action.type){
              case "SET_LOADING" :
                  return action.is_loading;
              default:
                  return state;
          }
      };

      let store = createStore(combineReducers({
          options,
          loading : loadingReducer,
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
          <div>
              <Load/>
              <Component {...this.props.config}/>
          </div>
        </Provider>
      </div>
    );
  }
}

export default App;
