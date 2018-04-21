import React from 'react';
import ServiceRequestForm from "./forms/request-form.jsx"
import Fetcher from "./utilities/fetcher.jsx"
import {Price, getPrice} from "./utilities/price.jsx";
import {getPrice as getTotalPrice, getPriceAdjustments} from "./widget-inputs/handleInputs";
import {connect} from 'react-redux';

let _ = require("lodash");
import {formValueSelector, getFormValues} from 'redux-form'

const REQUEST_FORM_NAME = "serviceInstanceRequestForm";
const selector = formValueSelector(REQUEST_FORM_NAME); // <-- same as form name
import {StickyContainer, Sticky} from 'react-sticky';
import getSymbolFromCurrency from 'currency-symbol-map'
import getWidgets from "./core-input-types/client"

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
            error: null
        };
        this.getCoverImage = this.getCoverImage.bind(this);
        this.getIcon = this.getIcon.bind(this);
        this.toggleEditingMode = this.toggleEditingMode.bind(this);
        this.toggleOnEditingGear = this.toggleOnEditingGear.bind(this);
        this.toggleOffEditingGear = this.toggleOffEditingGear.bind(this);
        this.getPriceData = this.getPriceData.bind(this);
        this.getService = this.getService.bind(this);
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

    getPriceData() {
        let {formJSON} = this.props;
        if (formJSON) {
            let handlers = getWidgets().reduce((acc, widget) => {
                acc[widget.type] = widget.handler;
                return acc;

            }, {});
            let newPrice = formJSON.amount;
            let adjustments = [];
            try {
                newPrice = getTotalPrice(formJSON.references.service_template_properties, handlers, formJSON.amount);
                adjustments = getPriceAdjustments(formJSON.references.service_template_properties, handlers)
            } catch (e) {
                console.error(e);
            }
            return {total: newPrice, adjustments};
        } else {
            return {total: 0, adjustments: []};
        }

    }

    getService() {
        let self = this;
        Fetcher(`${self.props.url}/api/v1/service-templates/${this.state.id}/request`).then(function (response) {
            if (!response.error) {
                let propertyOverrides = self.props.propertyOverrides;
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
            let {formJSON, options} = this.props;
            let {service, error} = this.state;
            if(this.state.error){
                return (<span>{error}</span>)
            }

            let prefix = getSymbolFromCurrency(service.currency);
            let {total, adjustments} = this.getPriceData();
            let filteredAdjustments = adjustments.filter(adjustment => adjustment.value > 0);
            let splitPricing = service.split_configuration;
            let splitTotal = 0;

            let rightHeading = "Plan Summary";
            switch (service.type) {
                case 'one_time':
                    rightHeading = "Payment Summary";
                    break;
                case 'custom':
                    rightHeading = "Custom Service";
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
                                {!this.props.hideHeaders && <div className="divider"><hr/></div>}
                                <ServiceRequestForm {...this.props} service={service}/>
                            </div>
                        </div>
                    </div>
                    {!this.props.hideSummary &&
                        <div className="rf--summary-wrapper">
                            <div className="rf--summary">
                                <div className="rf--summary-heading"><h4>{rightHeading}</h4></div>
                                <div className="rf--summary-content">
                                    {(service.trial_period_days > 0) ? (
                                        <div className="rf--free-trial-content">
                                            {service.trial_period_days} Day Free Trial
                                        </div>
                                    ) : null}
                                    {(service.type === "subscription" || service.type === "one_time") ? (
                                        <div className="rf--pricing-content">
                                            <div className="fe--pricing-breakdown-wrapper">
                                                <div className="subscription-pricing">
                                                    {(service.type === "subscription") ? (
                                                        <div className="fe--recurring-fee"><h5>Recurring Fee</h5></div>) : null}
                                                    {(service.type === "one_time") ? (
                                                        <div className="fe--base-price"><h5>Base Cost</h5></div>) : null}
                                                    <div className="fe--base-price-value">
                                                        {getPrice(service)}
                                                    </div>
                                                </div>
                                            </div>
                                            {filteredAdjustments.map((lineItem, index) => (
                                                <div key={"line-" + index} className="fe--line-item-pricing-wrapper">
                                                    <div className="subscription-pricing">
                                                        <div
                                                            className="fe--line-item">{lineItem.name}</div>
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

                                    {(service.type === "custom") ? (
                                        <div className="rf--quote-content">Custom Quote</div>
                                    ) : null}

                                    {(service.type === "split" && splitPricing) ? (
                                        <div>
                                            {splitPricing.splits.map((splitItem, index) => (
                                                <div key={"split-" + index} className="rf--split-wrapper">
                                                    <div className="subscription-pricing">
                                                        <div className="col-md-6 p-r-0 p-l-0">{(splitItem.charge_day === 0) ? (
                                                            <span>Right Now</span>) : (
                                                            <span>After {splitItem.charge_day} Days</span>)}</div>
                                                        <div className="col-md-6 p-r-0 p-l-0 text-right"><b><Price
                                                            value={splitItem.amount} prefix={prefix}/></b>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="total-price">
                                                <div className="row m-r-0 m-l-0">
                                                    <div className="col-md-6 p-r-0 p-l-0">Total:</div>
                                                    <div className="col-md-6 p-r-0 p-l-0 text-right">
                                                        <b><Price value={splitTotal} prefix={prefix}/></b>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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