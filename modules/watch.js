var fs = require('fs');
var path = require('path');
var config = require('./../config');

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function convert(full) {
	return full.replace(new RegExp(escapeRegExp(path.sep), 'g'), '/')
}
exports.setup = function (io) {
	if (Object.keys(config.shares).length == 0) {
		console.error('Please add some shared folders to your config.js and restart the server!');
		return;
	}
	for (id in config.shares) {
		var dir = config.shares[id];

		if (!dir.folder) {
			console.error('Shared item "' + id + '" has no defined folder!');
			continue;
		}
		try {
			if (!fs.statSync(dir.folder).isDirectory()) {
				console.error('Invalid folder "' + dir.folder + '" for shared item "' + id + '"!');
				continue;
			}
		} catch (e) {
			console.error('The folder "' + dir.folder + '" for shared item "' + id + '" does not exist!');
			continue;
		}

		(function (dir) {
			var fsmonitor = require('fsmonitor');
			fsmonitor.watch(path.resolve(dir.folder), null, function (change) {

				change.addedFiles.forEach(function (item) {
					item = dir.folder + path.sep + item;
					console.log('File', item, 'has been added');
					var stats = fs.statSync(item);
					io.sockets.emit(convert(path.dirname(item)), {
						op: 'addFile',
						file: {
							name: convert(path.basename(item)),
							full: convert(item),
							size: stats.size,
							created: new Date(stats.ctime),
							modified: new Date(stats.mtime)
						}
					});
				});

				change.modifiedFiles.forEach(function (item) {
					item = dir.folder + path.sep + item;
					console.log('File', item, 'has been modified');
					var stats = fs.statSync(item);
					io.sockets.emit(convert(path.dirname(item)), {
						op: 'modifyFile',
						file: {
							name: convert(path.basename(item)),
							full: convert(item),
							size: stats.size,
							created: new Date(stats.ctime),
							modified: new Date(stats.mtime)
						}
					});
				});

				change.removedFiles.forEach(function (item) {
					item = dir.folder + path.sep + item;
					console.log('File', item, 'has been removed');
					io.sockets.emit(convert(path.dirname(item)), {
						op: 'deleteFile',
						file: {
							name: convert(path.basename(item))
						}
					});
				});

				change.addedFolders.forEach(function (item) {
					item = dir.folder + path.sep + item;
					console.log('Directory', item, 'has been added');
					io.sockets.emit(convert(path.dirname(item)), {
						op: 'addDir',
						dir: {
							name: convert(path.basename(item)),
							folder: convert(item)
						}
					});
				});

				change.removedFolders.forEach(function (item) {
					item = dir.folder + path.sep + item;
					console.log('Directory', item, 'has been removed');
					io.sockets.emit(convert(path.dirname(item)), {
						op: 'deleteDir',
						dir: {
							name: convert(path.basename(item))
						}
					});
				});

			});

		})(dir);

		console.log('Shared "' + (dir.display || dir.folder) + '" (' + dir.folder + ') @' + id);
	}
}