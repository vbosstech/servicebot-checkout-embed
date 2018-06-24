import React from 'react';
import ServiceRequestForm from "./forms/request-form.js"
import {Fetcher} from "servicebot-base-form"
import {Price, getPrice} from "./utilities/price.js";
import {connect} from 'react-redux';
import {formValueSelector, getFormValues} from 'redux-form'
const REQUEST_FORM_NAME = "serviceInstanceRequestForm";
const selector = formValueSelector(REQUEST_FORM_NAME); // <-- same as form name
import getSymbolFromCurrency from 'currency-symbol-map'
import {getPriceData} from "./core-input-types/client";
class ServiceRequest extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            id: this.props.templateId,
            service: null,
            image: null,
            icon: null,
            editingMode: false,
            editingGear: false,
            error: null,
            step : 0
        };
        this.getCoverImage = this.getCoverImage.bind(this);
        this.getIcon = this.getIcon.bind(this);
        this.toggleEditingMode = this.toggleEditingMode.bind(this);
        this.toggleOnEditingGear = this.toggleOnEditingGear.bind(this);
        this.toggleOffEditingGear = this.toggleOffEditingGear.bind(this);
        this.getService = this.getService.bind(this);
        this.stepForward = this.stepForward.bind(this);
        this.stepBack = this.stepBack.bind(this);
    }

    componentDidMount() {
        this.getService();
        //this.getCoverImage();
        this.getIcon();
    }


    getCoverImage() {
        let self = this;
        let imageURL = `${this.props.url}/api/v1/service-templates/${this.state.id}/image`;
        fetch(imageURL).then(function (response) {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('Network response was not ok.', response);
        }).then(function (myBlob) {
            let objectURL = URL.createObjectURL(myBlob);
            self.setState({image: objectURL});
        }).catch(function (error) {

        });
    }
    stepForward(e){
        this.setState({step: 1});
    }
    stepBack(e){
        e.preventDefault();
        this.setState({step: 0});
    }

    getIcon() {
        let self = this;
        fetch(`/api/v1/service-templates/${this.state.id}/icon`).then(function (response) {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('Network response was not ok.');
        }).then(function (myBlob) {
            let objectURL = URL.createObjectURL(myBlob);
            self.setState({icon: objectURL});
        }).catch(function (error) {

        });
    }

    toggleEditingMode() {
        if (this.state.editingMode) {
            this.setState({editingMode: false})
        } else {
            this.setState({editingMode: true})
        }
    }

    toggleOnEditingGear() {
        this.setState({editingGear: true})
    }

    toggleOffEditingGear() {
        this.setState({editingGear: false})
    }


    getService() {
        let self = this;
        let headers = new Headers({
            "Content-Type": "application/json"
        });
        let req = {
                method: "GET",
                headers: headers,

        };
        Fetcher(`${self.props.url}/api/v1/service-templates/${this.state.id}/request`, "GET", null, req).then(function (response) {
            if (!response.error) {
                let propertyOverrides = self.props.propertyOverrides;
                response.payment_structure_template_id = self.props.paymentStructureTemplateId;
                if(propertyOverrides) {
                    response.references.service_template_properties = response.references.service_template_properties.map(prop => {
                        if (propertyOverrides[prop.name]){
                            prop.prompt_user = false;
                            prop.private = true;
                            prop.data = {value : propertyOverrides[prop.name]};
                        }
                        return prop;
                    })
                }

                self.setState({service: response});
            } else {
                if(response.error === "Unauthenticated"){
                    self.setState({error : "Error: Trying to request unpublished template"});
                }
                console.error("Error getting template request data", response);
            }
            self.setState({loading: false});
        });
    }

    getAdjustmentSign(adjustment, prefix) {
        switch (adjustment.operation) {
            case "subtract":
                return <span>- <Price value={adjustment.value} prefix={prefix}/></span>;
                break;
            case "multiply":
                return <span>+ %{adjustment.value}</span>;
                break;
            case"divide":
                return <span>- %{adjustment.value}</span>;
                break;
            default:
                return <span>+ <Price value={adjustment.value} prefix={prefix}/></span>;
        }
    }

    render() {
        if (this.state.loading) {
            return (<span></span>);
        } else {
            let {formJSON, options, paymentStructureTemplateId} = this.props;
            let {service, error} = this.state;
            let pricingPlan = service.references.tiers.reduce((acc, tier) => {
               let plan = tier.references.payment_structure_templates.find(p => p.id == paymentStructureTemplateId);
               if(plan){
                   acc = plan;
               }
               return acc;
            }, null);

            if(this.state.error){
                return (<span>{error}</span>)
            }

            let prefix = getSymbolFromCurrency(service.currency);
            let {total, adjustments} = getPriceData(pricingPlan && pricingPlan.amount, formJSON && formJSON.references.service_template_properties);
            let filteredAdjustments = adjustments.filter(adjustment => adjustment.value > 0);
            let splitPricing = service.split_configuration;
            let splitTotal = 0;

            let rightHeading = "Plan Summary";
            switch (service.type) {
                case 'one_time':
                    rightHeading = "Payment Summary";
                    break;
                case 'custom':
                    rightHeading = "Contact";
                    break;
                case 'split':
                    rightHeading = "Scheduled Payments";
                    if (splitPricing) {
                        splitPricing.splits.map((split) => {
                            splitTotal += split.amount;
                        });
                    }
                    break;
                default:
                    rightHeading = "Plan Summary";
            }

            const requestClasses = this.props.hideSummary ? "summary-hidden" : "summary-shown";
            return (
                <div className="servicebot--embeddable servicebot--request-user-form-wrapper custom">
                    {/*{JSON.stringify(this.getPriceData())}*/}
                    <div className={`rf--form-wrapper ${requestClasses}`}>
                        <div className={`rf--form`}>
                            {!this.props.hideHeaders &&
                                <div className="rf--form-heading">
                                    <h4>{service.name}</h4>
                                </div>
                            }
                            <div className="rf--form-content">
                                <div className="rf--basic-info">
                                    {!this.props.hideHeaders &&
                                        <div className="rf--details">
                                            <div dangerouslySetInnerHTML={{__html: service.details}}/>
                                        </div>
                                    }
                                </div>
                                <ServiceRequestForm plan={pricingPlan} {...this.props} step={this.state.step} stepForward={this.stepForward} stepBack={this.stepBack} service={service}/>
                            </div>
                        </div>
                    </div>
                    {!this.props.hideSummary && this.state.step === 1 && pricingPlan &&
                        <div className="rf--summary-wrapper">
                            <div className="rf--summary">
                                <div className="rf--summary-heading"><h4>{rightHeading}</h4></div>
                                <div className="rf--summary-content">
                                    {(pricingPlan.trial_period_days > 0) ? (
                                        <div className="rf--free-trial-content">
                                            {pricingPlan.trial_period_days} Day Free Trial
                                        </div>
                                    ) : null}
                                    {(pricingPlan.type === "subscription" || pricingPlan.type === "one_time") ? (
                                        <div className="rf--pricing-content">
                                            <div className="fe--pricing-breakdown-wrapper">
                                                <div className="subscription-pricing">
                                                    {(pricingPlan.type === "subscription") ? (
                                                        <div className="fe--recurring-fee"><h5>Recurring Fee</h5></div>) : null}
                                                    {(pricingPlan.type === "one_time") ? (
                                                        <div className="fe--base-price"><h5>Base Cost</h5></div>) : null}
                                                    <div className="fe--base-price-value">
                                                        {getPrice(pricingPlan)}
                                                    </div>
                                                </div>
                                            </div>
                                            {filteredAdjustments.map((lineItem, index) => (
                                                <div key={"line-" + index} className="fe--line-item-pricing-wrapper">
                                                    <div className="subscription-pricing">
                                                        <div
                                                            className="fe--line-item">{lineItem.prop_label}</div>
                                                        <div className="fe--line-item-price-value">
                                                            {this.getAdjustmentSign(lineItem, prefix)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="fe--total-price-wrapper">
                                                <div className="fe--total-price-label"><h5>Total:</h5></div>
                                                <div className="fe--total-price-value">
                                                    <Price value={total} prefix={prefix}/>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {(pricingPlan.type === "custom") ? (
                                        <div className="rf--quote-content">Contact</div>
                                    ) : null}

                                </div>
                            </div>
                        </div>
                    }
                </div>
            );
        }
    }
}

function mapStateToProps(state) {
    return {
        options: {},
        formJSON: getFormValues(REQUEST_FORM_NAME)(state)
    }
}


ServiceRequest = connect(mapStateToProps)(ServiceRequest);
let Wrapper = function (props) {

    return (<Provider store={store}>
    </Provider>)
};

export default ServiceRequest;