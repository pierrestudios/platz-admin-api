// NodeApp: PlatzShare API
const fs = require('fs');

module.exports = NodeApp = {
    serverName: 'PlatzShare DevMachine/1.1 (Api Server)',
    appName: 'PlatzShare Api Server',
    appSecret: 'appSecret',
    DB: null,
    TablePrefix: 'ci_',
    Models: {
        User: null,
        Member: null,
        ProviderType: null,
        ServiceRequestProposal: null
    }
}

