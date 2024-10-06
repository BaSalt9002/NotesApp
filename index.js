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

function getHTML(file) {
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
  return html;
}

console.log(getHTML("pages/home.json"));

var homepage = "./index.html";
var server = http.createServer((req, res) => {
  switch (req.url) {
    case "/pages/master.css":
      console.log("Css finding...");
      res.writeHead(200, {"Content-Type":"text/css"});
      res.write(fs.readFileSync("pages/master.css"));
      break;
    case "/textbox.js":
      console.log("js finding...");
      res.writeHead(200, {"Content-Type":"text/javascript"});
      res.write(fs.readFileSync("textbox.js"));
      break;
    default:
      res.writeHead(200, {"Content-Type":"text/html"});
      res.write(fs.readFileSync(homepage));
  }
  res.end();
}).listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
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
    socket.emit("html", getHTML(file));
  });

  socket.on("addNote", (type, note, file) => {
    console.log("addNote");
    switch(type) {
      case "h1":
        editJSON(file, {"type":"h1","text":note.slice(1)});
        break;
      case "quote":
        editJSON(file, {"type":"quote","text":note.slice(1)});
        break;
      case "ul":
        editJSON(file, {
          "type":"ul",
          "contents": [
            {"type":"li", "text":note.slice(1)}
          ]
        });
        break;
      default:
        console.log("error");
    }
    socket.emit("html", getHTML(file));
  });
});