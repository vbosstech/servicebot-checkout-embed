import React from 'react';
import ReactDOM from 'react-dom';
// import './index.css';
import ServicebotCheckoutEmbed from './ServicebotCheckout';
import { AppContainer } from 'react-hot-loader'

// ReactDOM.render(<App />, document.getElementById('root'));

const Checkout = (config) => {
    ReactDOM.render(<ServicebotCheckoutEmbed {...config} external={true} />, config.selector);
}


if (module.hot) {
    module.hot.accept('./ServicebotCheckout.js', () => {
        const NextApp = require('./ServicebotCheckout.js').default;
        ReactDOM.render(
            <AppContainer>
                <NextApp/>
            </AppContainer>,
            document.getElementById('root')
        );
    });
}
export {ServicebotCheckoutEmbed, Checkout}


if (module.hot) {
    module.hot.accept('./ServicebotCheckout.js', () => {
        const NextApp = require('./ServicebotCheckout.js').default;
        ReactDOM.render(
            <AppContainer>
                <NextApp/>
            </AppContainer>,
            document.getElementById('root')
        );
    });
}
