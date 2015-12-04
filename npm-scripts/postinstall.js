var execSync = require('child_process').execSync
var stat = require('fs').stat

function exec(command) {
  execSync(command, { stdio: [0, 1, 2] })
}

stat('lib', function (error, stat) {
  if (error || !stat.isDirectory()) {
		console.log('directory name: ' + __dirname);
		var newDir = __dirname.replace('npm-scripts', '');
		console.log('where i will run this from: ' + newDir);
		exec('npm run build', {cwd: newDir})
	}
})
