import React from 'react';
import Fetcher from '../utilities/fetcher.jsx';
import {Price} from '../utilities/price.jsx';
import DateFormat from "../utilities/date-format.jsx";
import {BillingForm} from "./billing-settings-form.jsx";
import '../css/managed.css';



class ServicebotManagedBilling extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            instances: [],
            funds: [],
            fund_url : "api/v1/funds",
            spk: null,
            loading:true,
            cancel_modal: false,
            token: null
        };
        this.getServicebotDetails = this.getServicebotDetails.bind(this);
        this.requestCancellation = this.requestCancellation.bind(this);
        this.requestCancellation = this.requestCancellation.bind(this);
        this.getRequest = this.getRequest.bind(this);

    }

    componentDidMount() {
        let self = this;
        self.getSPK();
        self.getServicebotDetails();
        self.getFundingDetails();

    }
    async getFundingDetails(){
        let funds = await Fetcher(`${this.props.url}/api/v1/funds/own`, null, null, this.getRequest());
        this.setState({funds})
    }
    getRequest(method="GET", body){
        let headers = {
            "Content-Type": "application/json"
        };
        if(this.props.token){
            headers["Authorization"] = "JWT " + this.props.token;
        }



        let request = { method: method,
            headers: new Headers(headers),


        };

        if(method === "POST" || method==="PUT"){
            request.body = JSON.stringify(body)
        }
        return request;
    }


    getServicebotDetails() {
        let self = this;
        return Fetcher(`${self.props.url}/api/v1/service-instances/own`, "GET", null, this.getRequest("GET")).then(function (response) {
            if (!response.error) {
                self.setState({instances : response});
            }
        });
    }

    getSPK(){
        let self = this;
        fetch(`${this.props.url}/api/v1/stripe/spk`)
            .then(function(response) {
                return response.json()
            }).then(function(json) {
            self.setState({spk : json.spk});
        }).catch(e => console.error(e));
    }

    requestCancellation(id){
        let self = this;
        let body = {
            instance_id : id
        }
        Fetcher(`${this.props.url}/api/v1/service-instances/${id}/request-cancellation`, null, null, this.getRequest("POST", body)).then(function (response) {
            if (!response.error) {
                self.getServicebotDetails();
            }
        });
    }

    getTrialStatus(){
        let self = this;
        //Get service trial status
        if(self.state.instances.length > 0) {
            let inTrial = false;
            let trialExpires = '';
            let instance = self.state.instances[0];
            if(!instance.trial_end){
                return null;
            }
            let trial = new Date(instance.trial_end * 1000);
            let date_diff_indays = (date1, date2) => {
                let dt1 = new Date(date1);
                let dt2 = new Date(date2);
                return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) ) /(1000 * 60 * 60 * 24));
            }
            if(instance.status === "running") {
                let currentDate = new Date();
                //Service is trialing if the expiration is after current date
                if(currentDate < trial) {
                    inTrial = true;
                    trialExpires = `${date_diff_indays(currentDate, trial)} days`;
                }
            }
            if(inTrial) {
                if(self.state.funds.length === 0) {
                    return (
                        <div className="trial-notice red">
                            <strong>{trialExpires} left of the trial </strong> and you have no funding source. Your subscription will be deactivated after trial expiration date. If you would like to continue your service, please update your credit/debit card below.
                        </div>
                    )
                } else {
                    return (
                        <div className="trial-notice blue">
                            <strong>{trialExpires} left of the trial. </strong> The initial payment will be charged once trial expires.
                        </div>
                    )
                }
            } else {
                return (null);
            }
        } else {
            return (null);
        }
    }

    getBillingForm(){
        let self = this;
        let fund = self.state.funds[0];
        return (
            <div>
                {self.state.funds.length === 0 || !self.state.funds[0].source ?
                    <div>
                        <p>Add your funding credit/debit card.</p>
                        <BillingForm token={self.props.token} spk={self.state.spk} submitAPI={`${self.props.url}/${self.state.fund_url}`} />
                    </div>
                    :
                    <div>
                        <BillingForm token={self.props.token} spk={self.state.spk} submitAPI={`${self.props.url}/${self.state.fund_url}`} userFund={fund} />
                    </div>

                }
            </div>
        );
    }
    resubscribe(id){

            let headers = {
                "Content-Type": "application/json",
                'Accept': 'application/json'
            };
            if (this.props.token) {
                headers["Authorization"] = `JWT ${this.props.token}`;
            }

        let self = this;
        const URL = this.props.url;
        return async ()=>{
            self.setState({loading:true});
            let updatedInstance = await (await fetch(`${URL}/api/v1/service-instances/${id}/reactivate`, {
                method : "POST",
                headers
            })).json();
            await self.getServicebotDetails();
            self.setState({"loading" : false})
        }
    }
    render () {
        let self = this;
        let pageName = 'Account Billing';
        let subtitle = 'Manage your ServiceBot accounts & billing';

        return (
            <div>
                <div className="page-servicebot-billing">
                    <div id="service-instance-detail" className="row">
                        <div className="col-md-10 col-lg-8 col-md-offset-1 col-lg-offset-2">
                            {self.state.instances.length > 0 ?
                                <div className="row m-b-10">
                                    <div className="col-12">
                                        {this.getTrialStatus()}
                                        <h2>Account Billing</h2>
                                        {this.getBillingForm()}
                                        <hr/>
                                        <h2>Manage Account</h2>
                                        {self.state.instances.length > 0 ?
                                            <div>
                                                <p>Your current subscriptions are listed below:</p>
                                                {self.state.instances.map(service => (
                                                    <div className="service-instance-box navy">
                                                        <div className="service-instance-box-title">
                                                            {service.name}
                                                            <div className="pull-right">
                                                                <b><Price value={service.payment_plan.amount} /> / {service.payment_plan.interval}</b>
                                                                {service.status === "running" || service.status === "requested" || service.status === "in_progress" ?
                                                                    <button className="btn btn-default btn-rounded btn-sm m-l-5" onClick={this.requestCancellation.bind(this, service.id)}>Cancel Service</button>
                                                                    :
                                                                    <div className="sb-badge yellow m-l-10">{service.status.charAt(0).toUpperCase() + service.status.slice(1)}<i className="fa fa-refresh fa-spin fa-fw"/></div>
                                                                }
                                                                {service.status === "cancelled" && <button onClick={self.resubscribe(service.id)}>Resubscribe</button>}
                                                            </div>
                                                        </div>
                                                        <div className="service-instance-box-content">
                                                            <div>Status: <b>{service.status}</b></div>
                                                            <div>Purchased: <b><DateFormat date={service.created_at} time/></b></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            :
                                            <div><p>You currently don't have any managed applications.</p></div>
                                        }
                                    </div>

                                </div>
                                :
                                <div className="fetching"><i className="fa fa-refresh fa-spin fa-fw"/> Loading page. Make sure you are logged in!</div>
                            }
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}



export default ServicebotManagedBilling