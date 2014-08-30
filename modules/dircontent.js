var fs = require('fs');
var path = require('path');

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function convert(full) {
	return full.replace(new RegExp(escapeRegExp(path.sep), 'g'), '/')
}
exports.getContent = function (dir) {
	var folders = [];
	var files = [];
	var error = null;

	dir = dir.replace(/\//g, path.sep);
	try {
		fs.readdirSync(dir).forEach(function (item) {
			var full = dir + path.sep + item;
			var stats = fs.statSync(full);
			if (!stats)
				return;
			if (stats.isDirectory()) {
				folders.push({
					name: item,
					folder: convert(full)
				});
			} else if (stats.isFile()) {
				files.push({
					name: item,
					full: convert(full),
					size: stats.size,
					created: new Date(stats.ctime),
					modified: new Date(stats.mtime)
				});
			}
		});
	} catch (e) {
		console.error('Error: ' + e);
		error = e;
	}
	return {
		folders: folders,
		files: files,
		error: error
	};
}