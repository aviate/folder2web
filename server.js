#!/usr/bin/env node

var express = require('express'),
	bodyParser = require('body-parser'),
	path = require('path'),
	config = require('./config'),
	watch = require('./modules/watch'),
	dircontent = require('./modules/dircontent'),
	Busboy = require('busboy'),
	fs = require('fs'),
	argv = require('optimist').argv;

var app = express();

var port = parseInt(argv.port || 8080);
if (isNaN(port) || port < 1 || port > 65535) {
	console.error('The PORT environment variable is not valid.');
	return;
}

app.set('port', port);

var http = require('http'),
	server = http.createServer(app),
	io = require('socket.io')(server);

server.listen(port);
console.log('Server started on port ' + port);

app.use(bodyParser.json());

watch.setup(io);

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

app.post('/upload', function(req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var folder = null;
	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if (!folder) {
			console.error('Error: folder is empty!');
			return;
		}
		console.log('File "' + filename + '" uploading ...');
		file.pipe(fs.createWriteStream(path.join(path.resolve(folder), filename)));
		file.on('end', function() {
			console.log('File "' + fieldname + '" finished');
		});
	});
	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
		if (fieldname == 'folder')
			folder = val;
	});
	busboy.on('finish', function() {
		console.log('Upload completed.');
		res.writeHead(303, { Connection: 'close', Location: '/' });
		res.end();
	});
	req.pipe(busboy);
});

app.get('/shares', function(req, res) {
	var scope = { folders: [] };
	for (id in config.shares) {
		var share = config.shares[id];
		var folder = {
			id: id,
			name: share.display || share.folder,
			folder: share.folder.replace(new RegExp(escapeRegExp(path.sep), 'g'), '/')
		};
		if (share.password)
			folder.protected = true;
		scope.folders.push(folder);
	}
	res.json(scope);
});

app.post('/share', function(req, res) {
	res.json(dircontent.getContent(req.body.folder));
});

app.get('/download', function(req, res) {
	res.download(req.query.file.replace(/\//g, path.sep));
});

app.post('/mkdir', function(req, res) {
	fs.mkdirSync(path.join(path.resolve(req.body.folder), req.body.name));
	res.send('ok');
});

app.use('/', express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/bower_components'));