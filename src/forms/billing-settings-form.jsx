import React from 'react';
import {Elements, injectStripe, CardElement, StripeProvider} from 'react-stripe-elements';
import "../css/servicebot--form-elements.css";

class CardSection extends React.Component {
    render() {
        return (
            <div className="form-group" id="card-element">
                <CardElement style={{
                    base: {
                        color: '#32325d',
                        lineHeight: '24px',
                        fontFamily: 'Helvetica Neue',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                }}/>
            </div>
        );
    }
}




export {CardSection};
