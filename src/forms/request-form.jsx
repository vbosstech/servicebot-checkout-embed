import React from 'react';
import 'react-tagsinput/react-tagsinput.css';
import '../widget-inputs/css/template-create.css';
import {
    Field,
    FormSection,
    FieldArray,
    formValueSelector,
    getFormValues,
} from 'redux-form'
import {connect} from "react-redux";
import {RenderWidget, WidgetList, widgets, SelectWidget} from "../utilities/widgets";
import {inputField, selectField, widgetField, priceField} from "../widget-inputs/servicebot-base-field.jsx";
import {CardSection} from "../forms/billing-settings-form.jsx";
import getSymbolFromCurrency from 'currency-symbol-map'

import {Price} from "../utilities/price.jsx";
import Fetcher from "../utilities/fetcher.jsx";
import {required, email, numericality, length} from 'redux-form-validators'
import {injectStripe, Elements, StripeProvider} from 'react-stripe-elements';
import getWidgets from "../core-input-types/client";

let _ = require("lodash");

import ServiceBotBaseForm from "./servicebot-base-form.jsx";
import {getPrice} from "../widget-inputs/handleInputs";
import values from 'object.values';

if (!Object.values) {
    values.shim();
}

const selector = formValueSelector('serviceInstanceRequestForm'); // <-- same as form name


//Custom property
let renderCustomProperty = (props) => {
    const {fields, formJSON, meta: {touched, error}} = props;
    let widgets = getWidgets().reduce((acc, widget) => {
        acc[widget.type] = widget;
        return acc;
    }, {});
    return (
        <div>
            {fields.map((customProperty, index) => {
                    let property = widgets[formJSON[index].type];
                    if(formJSON[index].prompt_user){

                        return (
                            <Field
                                key={index}
                                name={`${customProperty}.data.value`}
                                type={formJSON[index].type}
                                widget={property.widget}
                                component={widgetField}
                                label={formJSON[index].prop_label}
                                // value={formJSON[index].data.value}
                                formJSON={formJSON[index]}
                                configValue={formJSON[index].config}
                                validate={required()}
                            />)
                    }else{
                        if(formJSON[index].data && formJSON[index].data.value){
                            return (
                                <div className={`form-group form-group-flex`}>
                                    {(formJSON[index].prop_label && formJSON[index].type !== 'hidden') && <label className="control-label form-label-flex-md">{formJSON[index].prop_label}</label>}
                                    <div className="form-input-flex">
                                        <p>{formJSON[index].data.value}</p>
                                    </div>
                                </div>)
                        }else{
                            return (<span/>)
                        }


                    }

                }
            )}
        </div>
    )
};



//The full form
class ServiceRequestForm extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        let props = this.props;
        const {handleSubmit, formJSON, helpers, error} = props;
        let handlers = getWidgets().reduce((acc, widget) => {
            acc[widget.type] = widget.handler;
            return acc;

        }, {});
        let newPrice = formJSON.amount;
        try {
            newPrice = getPrice(formJSON.references.service_template_properties, handlers, formJSON.amount);
            helpers.updatePrice(newPrice);
        } catch (e) {
            console.error(e);
        }

        let getRequestText = () => {
            let serType = formJSON.type;
            let trial = formJSON.trial_period_days !== 0;
            let prefix = getSymbolFromCurrency(formJSON.currency);
            if(trial){
                return ("Get your Free Trial")
            }
            else {
                if (serType === "subscription") {
                    return (
                        <span>{"Subscribe "}
                            <Price value={newPrice} prefix={prefix}/>
                            {formJSON.interval_count == 1 ? ' /' : ' / ' + formJSON.interval_count} {' ' + formJSON.interval}
                    </span>
                    );
                } else if (serType === "one_time") {
                    return (
                        <span>{"Buy Now"} <Price value={newPrice} prefix={prefix}/></span>
                    );
                } else if (serType === "custom") {
                    return ("Request");
                } else if (serType === "split") {
                    return ("Buy Now");
                } else {
                    return (<span><Price value={newPrice} prefix={prefix}/></span>)
                }
            }
        };
        //Sort users and if user does not have name set, set it to the email value which will always be there

        return (
            <div className="service-request-form-body">
                {/*             <div className="col-md-3">
                 Tabs
                 <pre className="" style={{maxHeight: '300px', overflowY: 'scroll'}}>
                 {JSON.stringify(formJSON, null, 2)}
                 </pre>
                 </div>*/}
                <form onSubmit={handleSubmit}>

                    {!helpers.uid &&
                    <div>
                        <Field name="email" type="text" component={inputField}
                               label="Email Address" validate={[required(), email()]}/>

                        {helpers.emailExists && "That email is in use"}
                    </div>
                    }
                    <FormSection name="references">
                        <FieldArray name="service_template_properties" component={renderCustomProperty}
                                    formJSON={formJSON.references.service_template_properties}/>
                    </FormSection>

                    <button className="btn btn-rounded btn-primary btn-bar submit-request" type="submit" value="submit">
                        {getRequestText()}
                    </button>
                    {error &&
                    <strong>
                        {error}
                    </strong>}
                </form>
            </div>
        )
    };
}

ServiceRequestForm = connect((state, ownProps) => {
    return {
        "serviceTypeValue": selector(state, `type`),
        formJSON: getFormValues('serviceInstanceRequestForm')(state),

    }
})(ServiceRequestForm);

class ServiceInstanceForm extends React.Component {

    constructor(props) {
        super(props);

        let templateId = this.props.templateId || 1;
        this.state = {
            uid: this.props.uid,
            stripToken: null,
            templateId: templateId,
            templateData: this.props.service,
            formData: this.props.service,
            formURL: this.props.url + "/api/v1/service-templates/" + templateId + "/request",
            formResponseData: null,
            formResponseError: null,
            serviceCreated: false,
            servicePrice: this.props.service.amount,
            usersData: {},
            usersURL: "/api/v1/users",
            hasCard: null,
            loading: true,
            hasFund: false
        };
        this.closeUserLoginModal = this.closeUserLoginModal.bind(this);
        this.updatePrice = this.updatePrice.bind(this);
        this.submissionPrep = this.submissionPrep.bind(this);
        this.handleResponse = this.handleResponse.bind(this);

    }

    componentDidMount() {
        let self = this;
        Fetcher(self.state.formURL).then(function (response) {
            if (!response.error) {
                self.setState({loading: false, templateData: response, formData: response});
            } else {
                console.error("Error", response.error);
                self.setState({loading: false});
            }
        }).catch(function (err) {
            console.error("ERROR!", err);
        });
    }

    componentDidUpdate(nextProps, nextState) {
        if (nextState.serviceCreated) {
            // browserHistory.push(`/service-instance/${nextState.serviceCreated.id}`);
        }
    }


    updatePrice(newPrice) {
        let self = this;
        self.setState({servicePrice: newPrice});
    }


    closeUserLoginModal() {
        this.setState({emailExists: false});
    }

    async submissionPrep(values) {
        let token = await this.props.stripe.createToken();
        if (token.error) {
            throw token.error.message
        }
        return {...values, token_id: token.token.id};
    }
    handleResponse(response){
        this.setState({serviceCreated: true});
        if(this.props.handleResponse){
            this.props.handleResponse(response);
        }
    }


    formValidation(values) {

        let props = (values.references && values.references.service_template_properties) ? values.references.service_template_properties : [];
        let re = props.reduce((acc, prop, index) => {
            if (prop.required && (!prop.data || !prop.data.value)) {
                acc[index] = {data: {value: "is required"}}
            }
            return acc;
        }, {});
        let validation = {references: {service_template_properties: re}};

        if (Object.keys(re).length === 0) {
            delete validation.references;
        }
        return validation;

    }

    render() {

        let self = this;
        let initialValues = this.props.service;
        let initialRequests = [];
        let submissionPrep;
        let submissionRequest = {
            'method': 'POST',
            'url': `${this.props.url}/api/v1/service-templates/${this.props.templateId}/request`
        };
        let successMessage = "Service Requested";
        let successRoute = "/my-services";
        //If admin requested, redirect to the manage subscription page

        let helpers = Object.assign(this.state, this.props);
        helpers.updatePrice = self.updatePrice;
        //Gets a token to populate token_id for instance request
        let needsCard = (this.state.servicePrice > 0 &&
            !this.state.hasCard && initialValues.trial_period_days <= 0) || this.props.forceCard || this.state.templateData.type === "split"
        if ( needsCard){
            submissionPrep = this.submissionPrep;
        }
        return (
            <div>
                {needsCard && !this.state.serviceCreated &&
                <CardSection/>}


                <ServiceBotBaseForm
                    form={ServiceRequestForm}
                    initialValues={initialValues}
                    initialRequests={initialRequests}
                    submissionPrep={submissionPrep}
                    submissionRequest={submissionRequest}
                    successMessage={successMessage}
                    // successRoute={successRoute}
                    handleResponse={this.handleResponse}
                    formName="serviceInstanceRequestForm"
                    helpers={helpers}
                    validations={this.formValidation}
                    loaderTimeout={false}
                />
            </div>
        )

    }
}

ServiceInstanceForm = injectStripe(ServiceInstanceForm);


class ServicebotRequestForm extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loading : false
        };
        this.getService = this.getService.bind(this);
    }
    componentDidMount(){
        // this.getService();
    }
    getService(){
        let self = this;
        Fetcher(`${this.props.url}/api/v1/service-templates/${this.props.templateId}/request`).then(function(response){
            if(!response.error){
                self.setState({service : response});
            }else{
                console.error("Error getting template request data", response);
            }
            self.setState({loading:false});
        });
    }

    render() {

        let spk = this.props.spk;
        if(this.state.loading){
            return "Loading";
        }
        let form = (<StripeProvider apiKey={spk || "no_public_token"}>
                <Elements>
                    <ServiceInstanceForm {...this.props}/>
                </Elements>
            </StripeProvider>
        )
        if(this.props.hasStore) {
            return form
        }else {
            return form

        }
    }
}




export default ServicebotRequestForm;

