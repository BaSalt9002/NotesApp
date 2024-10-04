const http = require('http');
const fs = require('fs');
const socket = require('socket.io');
const markdownit = require('markdown-it');
const md = markdownit();

function editJSON(file, content) {
  currJSON = JSON.parse(fs.readFileSync(file));
  console.log(currJSON);
  currJSON["order"].push(content);
  fs.writeFileSync(file, JSON.stringify(currJSON));
}

editJSON("pages/home.json", {"type":"quote", "text":"HI!"});

var homepage = "./index.html";
var server = http.createServer((req, res) => {
  switch (req.url) {
    case "/pages/master.css":
      console.log("Css finding...");
      res.writeHead(200, {"Content-Type":"text/css"});
      res.write(fs.readFileSync("pages/master.css"));
      break;
    default:
      res.writeHead(200, {"Content-Type":"text/html"});
      res.write(fs.readFileSync(homepage));
  }
  res.end();
}).listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});

const io = socket(server);

io.on('connection', socket => {
  console.log("Client connected");
  socket.on('console', (data) => {
    console.log(`Client Console: ${data}`);
  });
  socket.on("getfiles", (user) => {
    var userfile = JSON.parse(fs.readFileSync("users.json"));
    console.log(userfile["users"][0]["info"]["files"]);
    socket.emit("filesel", userfile["users"][0]["info"]["files"]);
  });
  
  socket.on('markdown', (file) => {
    var currFile = JSON.parse(fs.readFileSync(file));
    var html = ``;
    for (let i in currFile["order"]) {
      if (currFile["order"][i]["type"] === "h1") {
        html += `<h1>${currFile["order"][i]["text"]}</h1>`;
      } else if (currFile["order"][i]["type"] === "quote") {
        html += `<quote>${currFile["order"][i]["text"]}</quote>`;
      } else if (currFile["order"][i]["type"] === "ul") {
        html += `<ul>`;
        for (let j in currFile["order"][i]["contents"]) {
          html += `<li>${currFile["order"][i]["contents"][j]["text"]}</li>`;
          console.log(currFile["order"][i]["contents"][j]["text"]);
        }
        html += `</ul>`;
      }
    }
    console.log(html);
    socket.emit('html', html);
  });
  socket.on("addNote", (type) => {

  });
});