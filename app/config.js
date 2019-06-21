var fs = require("fs");
require("dotenv").config();

module.exports = {
  dbtype: "mysql",
  dbhost: "localhost",
  dbname: "admin-api",
  dbuser: "root",
  dbpass: "",
  grouptypes: {
    Client: 1,
    "Property Manager": "g5261674b1b0c5",
    "Virtual Agent": "g526167a5e13cf",
    "Acquisition Agent": "g532b6d14d88dc",
    "Service Provider": "g52616856b6d54"
  },
  loadEnvVars: function() {
    const dbCreds = process.env;
    const dbCredsCD = module.exports.parseEnvDBUrl(
      process.env.CLEARDB_DATABASE_URL
    );
    module.exports.setDBParams(!!dbCreds.dbhost ? dbCreds : dbCredsCD);
    module.exports.appPort = process.env.APP_PORT;
    module.exports.appSecret = process.env.APP_SECRET;
  },
  setDBParams: function(data) {
    module.exports.dbhost = data.dbhost;
    module.exports.dbname = data.dbname;
    module.exports.dbuser = data.dbuser;
    module.exports.dbpass = data.dbpass;
    module.exports.dbtype = data.dbtype;
  },
  parseEnvDBUrl: function(envDBUrl = "") {
    envDBUrl = envDBUrl.replace("mysql://", "").replace("?reconnect=true", "");
    const envDBVars = envDBUrl.split("/");
    const envDBName = envDBVars[1] || "";
    const envDBVars2 = (envDBVars[0] && envDBVars[0].split("@")) || "";
    const envDBHost = envDBVars2[1] || "";
    const envDBVars3 = (envDBVars2[0] && envDBVars2[0].split(":")) || "";
    const envDBUser = envDBVars3[0] || "";
    const envDBPass = envDBVars3[1] || "";
    return {
      dbtype: "mysql",
      dbhost: envDBHost,
      dbname: envDBName,
      dbuser: envDBUser,
      dbpass: envDBPass
    };
  }
};

module.exports.loadEnvVars();
