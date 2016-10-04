var fs = require('fs');

module.exports = {
    "dbtype": "mysql",
    "dbhost": 'localhost',
    "dbname": 'admin-api', 
    "dbuser": 'root',
    "dbpass": '',
    "grouptypes": {
        "Client": 1,
        "Property Manager": 'g5261674b1b0c5',
        "Virtual Agent": 'g526167a5e13cf',
        "Acquisition Agent": 'g532b6d14d88dc',
        "Service Provider": 'g52616856b6d54'
    },
	loadEnv: function(filename, onFileContent, onError) {
	  fs.readFile(filename, 'utf-8', function(err, content) {
		if(err) {
		  onError(err);
		  return;
		}
		const data = JSON.parse(content);  
		onFileContent(data);
	  });
	},
	parseHerokuEnvDB: function(herokuEnvDBUrl) {
		herokuEnvDBUrl = herokuEnvDBUrl.replace('mysql://','');
		herokuEnvDBUrl = herokuEnvDBUrl.replace('?reconnect=true','');
		const herokuEnvDBVars = herokuEnvDBUrl.split('/');
		const herokuEnvDBName = herokuEnvDBVars[1] || '';
		const herokuEnvDBVars2 = (herokuEnvDBVars[0] && herokuEnvDBVars[0].split('@')) || '';
		const herokuEnvDBHost = herokuEnvDBVars2[1] || '';
		const herokuEnvDBVars3 = (herokuEnvDBVars2[0] && herokuEnvDBVars2[0].split(':')) || '';
		const herokuEnvDBUser = herokuEnvDBVars3[0] || '';
		const herokuEnvDBPass = herokuEnvDBVars3[1] || '';
		return {
			"dbtype": "mysql",
			"dbhost": herokuEnvDBHost,
			"dbname": herokuEnvDBName, 
			"dbuser": herokuEnvDBUser,
			"dbpass": herokuEnvDBPass
		}
	}
}