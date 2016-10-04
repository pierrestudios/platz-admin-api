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
	}
}