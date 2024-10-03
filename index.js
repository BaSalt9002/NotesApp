const http = require('http');
const fs = require('fs');
const socket = require('socket.io');

var homepage = "./index.html";
var server = http.createServer((req, res) => {
  fs.readFile(homepage, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
}).listen(8080);

const io = socket.io(server);

io.on('connection', socket => {
  console.log("Client connected");
  socket.on('hi', (data) => {
    console.log(data);
  });
  
  socket.on('markdown', (data) => {
    const html = marked(data);
    socket.emit('html', html);
  });
});