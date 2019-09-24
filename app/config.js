require("dotenv").config();

function parseDBUrl(dbUrl = "") {
  dbUrl = dbUrl.replace("mysql://", "").replace("?reconnect=true", "");
  const [dbVars, dbName] = dbUrl.split("/");
  const [dbVars2, dbHost] = dbVars.split("@");
  const [dbUser, dbPass] = dbVars2.split(":");

  return {
    dbtype: "mysql",
    dbhost: dbHost,
    dbname: dbName,
    dbuser: dbUser,
    dbpass: dbPass
  };
}

function loadEnvVars() {
  const {
    APP_PORT,
    APP_SECRET,
    DB_HOST,
    DB_NAME,
    DB_USER,
    DB_PASS,
    CLEARDB_DATABASE_URL
  } = process.env;

  const dbCredentials = (CLEARDB_DATABASE_URL &&
    parseDBUrl(CLEARDB_DATABASE_URL)) || {
    dbtype: "mysql",
    dbhost: DB_HOST,
    dbname: DB_NAME,
    dbuser: DB_USER,
    dbpass: DB_PASS
  };
  setDBParams(dbCredentials);
  module.exports.appPort = APP_PORT;
  module.exports.appSecret = APP_SECRET;
}

function setDBParams({ dbhost, dbname, dbuser, dbpass, dbtype }) {
  module.exports.dbhost = dbhost;
  module.exports.dbname = dbname;
  module.exports.dbuser = dbuser;
  module.exports.dbpass = dbpass;
  module.exports.dbtype = dbtype;
}

module.exports = {
  grouptypes: {
    Client: 1,
    "Property Manager": "g5261674b1b0c5",
    "Virtual Agent": "g526167a5e13cf",
    "Acquisition Agent": "g532b6d14d88dc",
    "Service Provider": "g52616856b6d54"
  }
};

loadEnvVars();
