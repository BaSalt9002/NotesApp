const http = require('http');
const fs = require('fs');
const socket = require('socket.io');
const markdownit = require('markdown-it');
const md = markdownit();

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
}).listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});

const io = socket(server);

io.on('connection', socket => {
  console.log("Client connected");
  socket.on('hi', (data) => {
    console.log(`Socket received the "hi" message coupled with: "${data}"`);
  });
  socket.on("getfiles", (user) => {
    var userfile = JSON.parse(fs.readFileSync("users.json"));
    console.log(userfile["users"][0]["info"]["files"]);
    socket.emit("filesel", userfile["users"][0]["info"]["files"]);
  });
  
  socket.on('markdown', (file) => {
    var currFile = JSON.parse(fs.readFileSync(file));
    var html = ``
    for (let i in currFile["order"]) {
      if (currFile["order"][i]["type"] === "h1") {
        html += `<h1>${currFile["order"][i]["text"]}</h1>`;
      } else if (currFile["order"][i]["type"] === "quote") {
        html += `<quote>${currFile["order"][i]["text"]}</quote>`
      }
    }
    console.log(html);
    socket.emit('html', html);
  });
});