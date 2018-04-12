
//state : no configuration (missing DB, Salt, Stripe)
//state : no initialization (has DB, no tables)
//state : needs upgrade (has migration to perform)

//case : configure by code
//  Pass config parameters somehow/.. currently using .env... probably continue this/
//case : configure by api
//  Easy - use plugin to get route



//start app
//if config figures out app is not configured
//  start setup plugin
//  setup plugin waits for api to come
//  when api inserts the data.... put it in env and provide environment
//  initialization plugin consumes environment and checks database
let fs = require("fs");
let path = require("path");
let dotenv = require("dotenv");
//todo: move this into plugin
const PLUGIN_DIRECTORY = path.resolve(__dirname, "../plugins");
const PLUGIN_TABLE = "plugins";

module.exports = async function(){
    let plugins = [];
    if(!envExists()){
        plugins = basePlugins();
    }else{
        //bring in environment variables

        let envPath = path.resolve(__dirname, '../env/.env');
        dotenv.config({path: envPath});


        // let db = require('knex')({
        //     client: 'pg',
        //     connection: getDBConf(),
        //     pool: { min: 0, max: 10 }
        //
        // });

        // plugins = await getEnabledPlugins(db);
        plugins = basePlugins();
    }


    return {
        plugins : plugins,


        // //install function gets called whenever Pluginbot.prototype.install gets called passing available services
        // install: function* (services, pluginName, pluginInstall) {
        //     let db = yield consume(services.database);
        //     let trx = function () {
        //         db.transaction(async (trx) => {
        //             await trx(PLUGIN_TABLE).insert({
        //                 name: pluginName,
        //                 path: path.resolve(PLUGIN_DIRECTORY, pluginName),
        //                 enabled: false
        //             });
        //         });
        //     };
        //     yield call(trx);
        //     if (pluginInstall) {
        //         yield call(pluginInstall);
        //     }
        // },
        // //todo : should enable be in charge of running the plugin like install is in charge of installs?
        // enable: function* (services, pluginName) {
        //     let db = yield consume(services.database);
        //     let update = function () {
        //         return db(PLUGIN_TABLE).where("name", pluginName).update("enabled", true);
        //     }
        //     let res = yield call(update);
        // },
    }

};




let envExists = function() {
    return fs.existsSync(path.join(__dirname, '../env/.env'));
}


let getEnabledPlugins = async function(db){
    let pluginTableExists = await db.schema.hasTable(PLUGIN_TABLE);
    return  await (pluginTableExists ? db(PLUGIN_TABLE).where("enabled", true) : basePlugins());

}

let basePlugins = function() {

    return [
        {"path" : `${PLUGIN_DIRECTORY}/database`, dbConfig : getDBConf()},
        {"path" : `${PLUGIN_DIRECTORY}/setup`, initialConfig : getInitialConfig(), appConfig : getAppConf()},
        {"path" : `${PLUGIN_DIRECTORY}/system-options`},
        {"path" : `${PLUGIN_DIRECTORY}/api-gateway`, appConfig : getAppConf()},
        {"path" : `${PLUGIN_DIRECTORY}/stripe`},
        {"path" : `${PLUGIN_DIRECTORY}/authorization`},
        {"path" : `${PLUGIN_DIRECTORY}/notification`},
        {"path" : `${PLUGIN_DIRECTORY}/core-input-types`},
        {"path" : `${PLUGIN_DIRECTORY}/service-lifecycle`},
        {"path" : `${PLUGIN_DIRECTORY}/payment-manager`},
        {"path" : `${PLUGIN_DIRECTORY}/analytics`},
        {"path" : `${PLUGIN_DIRECTORY}/message-manager`},
        {"path" : `${PLUGIN_DIRECTORY}/user-manager`},
        {"path" : `${PLUGIN_DIRECTORY}/extra-css`},
        {"path" : `${PLUGIN_DIRECTORY}/client-plugins/ga`},
        {"path" : `${PLUGIN_DIRECTORY}/updates`, "interval" : 86400000, "master" : "https://hub.serviceshop.io/api/v1/announcements"},
        {"path" : `${PLUGIN_DIRECTORY}/webhooks`}
    ];
};
