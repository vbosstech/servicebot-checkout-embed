const path = require("path");
const BUILD_DIR = path.resolve(__dirname, './public/build');
const APP_DIR = path.resolve(__dirname, './src');
var webpack = require('webpack');

let config = async function () {
    let pluginbotConfig = {
        "core-input-types": {
            "pluginPackage" : {
                "pluginbot" : {
                    "client" : {
                        "main" : "client.js"
                    }
                }
            },
            "clientConfig" : {

            }
        }
    }
    return {
        entry: {
            "servicebot-embed": [ APP_DIR + '/index.js'],


        },
        output: {
            path: BUILD_DIR,
            publicPath: "/build/",
            filename: '[name].js',
            library: 'Servicebot',
            libraryTarget: 'umd',
            umdNamedDefine: true,

        },
        module : {
            rules: [
                {
                    test: /\.jsx?/,
                    include : [APP_DIR],
                    loader: 'babel-loader'
                },
                {
                    test: /\.css$/,
                    loader: "style-loader!css-loader"
                }
            ]
        },
        externals: {
            pluginbot_client_config: JSON.stringify(pluginbotConfig),
            _plugins: "_plugins",
        },
        devServer: {
            historyApiFallback: true,
            hot: true,
            contentBase: path.resolve(__dirname, 'public'),
            inline: true,
            host: 'localhost', // Defaults to `localhost`
            port: 3004
        },
        plugins : [
            new webpack.HotModuleReplacementPlugin(),

        ]
    }
};
module.exports = config;
