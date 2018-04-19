import React from 'react';
import {connect} from "react-redux"
import {getFormValues} from "redux-form";
class Load extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            type: this.props.type || 'content',
            message: "Loading...",
            loadState: "loading"
        };
    }

    componentDidMount() {
        let self = this;
        console.log("loading");
        // if(this.props.timeout !== false ){
        //     this.timeout = setTimeout(function(){
        //         // self.setState({message: "There seems to be a problem in processing your request. Please try again.", loadState: "done" });
        //     }, this.props.timeout || 10000);
        // }
    }

    componentWillUnmount() {
        console.log("unloading");
        clearTimeout(this.timeout);
    }

    render () {

        let style={};
        let loadingStyle={};
        if (this.state.type == 'content' || this.state.type == 'dataform'){
            if(this.state.loadState == 'loading'){
                loadingStyle={
                    position: 'absolute',
                    top: '50%',
                    left: '47%',
                    transform: 'translate(-50%,-50%)',
                    height: '80px',
                    width: '80px',
                    zIndex: 999999
                };
            }
        }else if(this.state.type == 'button'){
            if(this.state.loadState == 'loading'){
                loadingStyle={
                    height: '20px',
                    width: '20px'
                };
            }
        }else if(this.state.type == 'avatar'){
            if(this.state.loadState == 'loading'){
                loadingStyle={
                    height: '83px',
                    width: '83px'
                };
            }
        }
        console.log("loading:", this.props.loading);
        return(
            <div>
            {this.props.loading &&
            (<div className="loader" style={style}>
                <div className={this.state.loadState} style={loadingStyle}/>
                <p className={`help-block m-b-0 ${this.state.loadState}`}>{this.state.message}</p>
            </div>)}
            </div>
        );
    }
}
function mapStateToProps(state) {
    return {
        loading: state.loading
    }
}


export default connect(mapStateToProps)(Load);
