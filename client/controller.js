'use strict';

// see http://stackoverflow.com/a/728694
function clone(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

angular.module('folder2web', [])
.filter('byte', function() {
	return function(number, params) {
		var name = 'B';
		if (number > 1024) {
			number /= 1024;
			name = 'KB';
		}
		if (number > 1024) {
			number /= 1024;
			name = 'MB';
		}
		if (number > 1024) {
			number /= 1024;
			name = 'GB';
		}
		if (number > 1024) {
			number /= 1024;
			name = 'TB';
		}
		return Math.round(number * 100) / 100 + ' ' + name;
	}
})
.filter('time', function() {
	return function(date, params) {
		return moment(date).fromNow();
	}
})
.filter('icon', function() {
	return function(filename, params) {
		if (/\.jpg$/ig.test(filename)
			|| /\.jpeg$/ig.test(filename)
			|| /\.cr2$/ig.test(filename)
			|| /\.gif$/ig.test(filename)
			|| /\.png$/ig.test(filename)
			|| /\.bmp$/ig.test(filename)
			|| /\.tif$/ig.test(filename))
			return 'glyphicon-picture';
		if (/\.mov$/ig.test(filename)
			|| /\.mp4$/ig.test(filename)
			|| /\.mpeg2$/ig.test(filename)
			|| /\.flv$/ig.test(filename)
			|| /\.3gp$/ig.test(filename)
			|| /\.mkv$/ig.test(filename)
			|| /\.wmv$/ig.test(filename))
			return 'glyphicon-film';
		if (/\.mp3$/ig.test(filename)
			|| /\.wma$/ig.test(filename)
			|| /\.aac$/ig.test(filename)
			|| /\.wav$/ig.test(filename)
			|| /\.mid$/ig.test(filename)
			|| /\.aif$/ig.test(filename)
			|| /\.aiff$/ig.test(filename)
			|| /\.pcm$/ig.test(filename)
			|| /\.flac$/ig.test(filename))
			return 'glyphicon-music';
		return 'glyphicon-file';
	}
})
.controller('explorer', ['$scope', '$http', function($scope, $http) {
	var initialSubs = [
	{
		name: 'Home',
		dir: null,
		active: true
	}
	];
	$scope.subfolders = initialSubs;
	$scope.homefolders = [];
	$scope.download = function (file) {
		location.href = '/download?file=' + encodeURIComponent(file.full);
	}
	$scope.currentDir = '';
	$scope.socket = io.connect();

	$scope.home = function () {
		$scope.folders = [];
		$scope.files = [];
		$scope.currentDir = '';
		$http.get('shares').success(function(data) {
			$scope.folders = data.folders;
			$scope.homefolders = data.folders;
		}).error(function(data) {
			alertify.error(data.code);
			console.error(data);
		});
	};
	$scope.openDir = function (folder) {
		$scope.subfolders = [];
		initialSubs.forEach(function (sf) {
			$scope.subfolders.push(clone(sf));
		});
		if (folder == null) {
			$scope.home();
			return;
		}
		$scope.subfolders[0].active = false;

		$scope.socket.removeAllListeners($scope.currentDir);
		$scope.socket.on(folder.folder, function (data) {
			console.log(data);
			switch (data.op) {
				case 'addFile':
				$scope.$apply(function () {
					for (var i = 0; i < $scope.files.length; i++) {
						var f = $scope.files[i].name;
						if (f == data.file.name)
							return;
						if (f.localeCompare(data.file.name) > 0) {
							$scope.files.splice(i, 0, data.file);
							return;
						}
					}
					$scope.files.push(data.file);
				});
				break;
				case 'deleteFile':
				$scope.$apply(function () {
					for (var i = 0; i < $scope.files.length; i++) {
						var f = $scope.files[i].name;
						if (f == data.file.name) {
							$scope.files.splice(i, 1);
							return;
						}
					}
				});
				break;
				case 'modifyFile':
				$scope.$apply(function () {
					for (var i = 0; i < $scope.files.length; i++) {
						var f = $scope.files[i].name;
						if (f == data.file.name) {
							$scope.files.splice(i, 1, data.file);
							return;
						}
					}
				});
				break;
				case 'addDir':				
				$scope.$apply(function () {
					for (var i = 0; i < $scope.folders.length; i++) {
						var f = $scope.folders[i].name;
						if (f == data.dir.name)
							return;
						if (f.localeCompare(data.dir.name) > 0) {
							$scope.folders.splice(i, 0, data.dir);
							return;
						}
					}
					$scope.folders.push(data.dir);
				});
				break;
				case 'deleteDir':
				$scope.$apply(function () {
					for (var i = 0; i < $scope.folders.length; i++) {
						var f = $scope.folders[i].name;
						if (f == data.dir.name) {
							$scope.folders.splice(i, 1);
							return;
						}
					}
				});
				break;
			}
		});
$scope.currentDir = folder.folder;

$scope.homefolders.forEach(function (homefolder) {
	var l = homefolder.folder.length;
	if (folder.folder.substring(0, l) == homefolder.folder) {
		$scope.subfolders.push({
			name: homefolder.name,
			dir: homefolder,
			active: false
		});
		var f = clone(folder);
		var full = homefolder.folder;
		folder.folder.substring(l + 1).split('/').forEach(function (sub) {
			if (sub === '')
				return;
			full += '/' + sub;
			f.folder = full;
			f.name = sub;
			$scope.subfolders.push({
				name: sub,
				dir: clone(f),
				active: false
			});
		});
		$scope.subfolders[$scope.subfolders.length - 1].active = true;
	}
});

$http.post('/share', folder).success(function(data) {
	if (data.error != null) {
		$scope.home();
		console.error(data.error);
		alert(data.error.code);
	}
	$scope.folders = data.folders;
	$scope.files = data.files;
}).error(function(data) {
	alertify.error(data.code);
	console.error(data);
});
};

alertify.dialog('createDir', function factory () {
	return {
		prepare: function () {
			this.setHeader('Create a new folder');
		}
	};
}, true, 'prompt');

$scope.createDir = function () {
	alertify.createDir('Enter the name of the new folder', 'New folder', function (evt, value) {
		value = value.trim();
		if (value.length < 2) {
			alertify.error('Folder name is too short');
			return;
		}
		if (value.match(/[\/\\\?:^\*'"`´°!&\$<>|]/g)) {
			alertify.error('Invalid folder name');
			return;
		}
		var invalid = false;
		$scope.folders.forEach(function (folder) {
			if (folder.name == value) {
				alertify.error('Folder "' + value + '" already exists');
				invalid = true;
			}
		});
		if (!invalid) {
			$http.post('/mkdir', {
				folder: $scope.currentDir,
				name: value
			}).success(function(data) {
				alertify.success('Folder "' + value + '" has been created');
			}).error(function(data) {
				alertify.error(data.code);
				console.error(data);
			});
		}
	}).setting('header', 'Create a new folder').show();
};
$scope.home();

$scope.magic = function () {
	$('#logo').css('color', 'hsl(' + (Math.floor(100 + Math.random() * 300)%360) + ',100%,55%)');
}
}]);