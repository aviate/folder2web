angular.element(document).ready(function() {
	var $scope = angular.element(document.body).scope();
	function dragStart() {
		if ($scope.currentDir == '')
			return;
		document.getElementById('navigation').style.display = 'none';
		document.getElementById('dropfiles').className = 'show';
	}
	function dragEnd() {
		document.getElementById('navigation').style.display = 'block';
		document.getElementById('dropfiles').className = '';
	}

	$("*:visible").on('dragstart', function () { return false; });
	$("*:visible").on('dragenter dragover', dragStart);

	// prevent dragging of dom elements
	$("#dropfiles").on('dragleave dragexit', dragEnd);

	var dropzone = document.getElementById('dropzone');

	alertify.dialog('progressAlert', function factory () {
		return {
			main: function (files) {
				this.files = files;
			},
			build: function () {
				this.setHeader('Uploading ...');
				var content = '<div class="progress">'
				+ '<div class="progress-bar progress-bar-striped active" role="progressbar">'
				+ '</div></div>'
				+ '<div class="panel panel-default">'
				+ '<div class="panel-heading">Uploading files</div>'
				+ '<ul class="list-group"></ul></div>';
				this.setContent(content);
			},
			prepare: function () {
				$(this.elements.content).find('ul.list-group').empty();
				for (var i = 0; i < this.files.length; i++) {
					$(this.elements.content).find('ul.list-group').append(
						'<li class="list-group-item">' + this.files[i].name + '</li>');
				}
				this.elements.dialog.style.height = (215 + this.files.length * 42) + 'px';
			},
			setup: function () {
				return {
					buttons: [],
					options: {
						closable: false,
						maximizable: false
					}
				};
			},
			settings: {
				progress: 0
			},
			settingUpdated: function(key, oldValue, newValue) {
				switch (key) {
					case 'progress':
					$(this.elements.content).find('.progress-bar').css('width', newValue + '%')
					break;
				}
			}
		};
	}, true);

	var dia = null;
	function readfiles(files) {
		if ($scope.currentDir == '' || files.length == 0)
			return;
		if (!window.FormData) {
			alertify.error('FormData interface is not available.\nPlease update your browser.');
			return;
		}

		dia = alertify.progressAlert(files).close();

		// show progress dialog only for longer uploads
		window.setTimeout(function () {
			if (dia && dia.setting('progress') < 80)
				dia.show();
		}, 500);

		var formData = new FormData();
		formData.append('folder', $scope.currentDir);
		for (var i = 0; i < files.length; i++)
			formData.append('file', files[i]);

		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/upload');
		xhr.onload = function() {
			if (dia)
				dia.close();
			alertify.success('Upload finished');
		};

		if ("upload" in new XMLHttpRequest) {
			xhr.upload.onprogress = function (event) {
				if (event.lengthComputable) {
					var complete = (event.loaded / event.total * 100 | 0);
					dia.setting('progress', complete);
				}
			}
		}

		xhr.send(formData);
	}

	dropzone.ondragover = function () {
		this.className = 'hover';
		return false;
	};
	dropzone.ondragend = function () {
		this.className = '';
		return false;
	};
	dropzone.ondrop = function (e) {
		this.className = '';
		e.preventDefault();
		readfiles(e.dataTransfer.files);
		dragEnd();
	};

	function upload() {
		readfiles(document.getElementById('uploadbtn').files);
	};
});