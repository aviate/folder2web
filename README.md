folder2web
==========

folder2web is a small Node.js application that straightforwardly shares folders over the web. The server monitors the filesystem and transmits changes immediately to the modern web interface using Socket.IO. Files can be uploaded (using drag-and-drop) and downloaded.

## Installation

To install folder2web you need [npm](https://www.npmjs.org) and [bower](http://bower.io). Then issue the following command:

```sh
$ npm install
```

## Configuration

Edit `config.js` to manage shared folders.

```js
exports.shares = 
{
	exampleitem: { // internal identifier of the shared folder
		display: 'This is an example',  // (optional) name to be displayed in the web interface
		folder: '/here/comes/your/path' // absolute path of the folder
	}
}
```

## Start server

By default, the server will listen on port 8080.

```sh
$ node server.js [--port <portnumber>]
```

## License

Licensed under the MIT License.
