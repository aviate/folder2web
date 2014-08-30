[![GitHub version](https://badge.fury.io/gh/aviate%2Ffolder2web.svg)](http://badge.fury.io/gh/aviate%2Ffolder2web)

folder2web
==========

folder2web is a small Node.js application that straightforwardly shares folders over the web. The server monitors the filesystem and transmits changes immediately to the modern web interface using Socket.IO. Files can be uploaded (using drag-and-drop) and downloaded.

####Install dependencies using [npm](https://www.npmjs.org) and [bower](http://bower.io)

```sh
$ npm install
$ bower install
```

####Configuration

Use `config.js` to manage shared folders.

```js
exports.shares = 
{
	exampleitem: { // internal identifier of the shared folder
		display: 'This is an example',  // (optional) name to be displayed in the web interface
		folder: '/here/comes/your/path' // absolute path of the folder
	}
}
```

####Start server

```sh
$ node server.js [port]
```
