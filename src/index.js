import React from 'react';
import ReactDOM from 'react-dom';
// import '../css/servicebot--colors.css';
// import '../css/servicebot--form-elements.css';
// import '../css/servicebot--layout.css';
// import '../css/servicebot--text-elements.css';
import ServicebotCheckoutEmbed from './ServicebotCheckout';
import { AppContainer } from 'react-hot-loader'

// ReactDOM.render(<App />, document.getElementById('root'));

const Checkout = (config) => {
    ReactDOM.render(<ServicebotCheckoutEmbed {...config} external={true} />, config.selector);
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
