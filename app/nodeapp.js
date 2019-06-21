var { appSecret } = require("./config");

module.exports = NodeApp = {
  serverName: "Platz DevMachine/1.1 (Api Server)",
  appName: "Platz Api Server",
  appSecret: appSecret,
  DB: null,
  TablePrefix: "ci_",
  Models: {
    User: null,
    Member: null,
    ProviderType: null,
    ServiceRequestProposal: null
  }
};
