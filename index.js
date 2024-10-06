const http = require('http');
const fs = require('fs');
const socket = require('socket.io');
const markdownit = require('markdown-it');
const md = markdownit();

function returnsTrue(){
  return Boolean(1===1);
}

function editJSON(file, content) {
  currJSON = JSON.parse(fs.readFileSync(file));
  currJSON["order"].push(content);
  fs.writeFileSync(file, JSON.stringify(currJSON));
}

function appendJSON(file, type, content) {
  currJSON = JSON.parse(fs.readFileSync(file));
  switch(type) {
    case "ul":
      currJSON["order"].findLast(returnsTrue)["contents"].push(content);
  }
  fs.writeFileSync(file, JSON.stringify(currJSON));
}

function getHTML(file) {
  var currFile = JSON.parse(fs.readFileSync(file));
  var html = ``;
  for (let i in currFile["order"]) {
    if (currFile["order"][i]["type"] === "h1") {
      html += `<h1>${currFile["order"][i]["text"]}</h1>`;
    } else if (currFile["order"][i]["type"] === "quote") {
      html += `<div id="quote">${currFile["order"][i]["text"]}</div>`;
    } else if (currFile["order"][i]["type"] === "ul") {
      html += `<ul>`;
      for (let j in currFile["order"][i]["contents"]) {
        html += `<li>${currFile["order"][i]["contents"][j]["text"]}</li>`;
      }
      html += `</ul>`;
    } else if(currFile["order"][i]["type"] === "h2") {
      html += `<h2>${currFile["order"][i]["text"]}</h2>`;
    } else if (currFile["order"][i]["type"] === "h3") {
      html += `<h3>${currFile["order"][i]["text"]}</h3>`;
    }
    else {
      html += `<p>${currFile["order"][i]["text"]}</p>`;
    }
  }
  return html;
}

var homepage = "./index.html";
var server = http.createServer((req, res) => {
  switch (req.url) {
    case "/pages/master.css":
      res.writeHead(200, {"Content-Type":"text/css"});
      res.write(fs.readFileSync("pages/master.css"));
      break;
    case "/textbox.js":
      res.writeHead(200, {"Content-Type":"text/javascript"});
      res.write(fs.readFileSync("textbox.js"));
      break;
    default:
      res.writeHead(200, {"Content-Type":"text/html","charset":"utf-8"});
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
    socket.emit("filesel", userfile["users"][0]["info"]["files"]);
  });
  
  socket.on('markdown', (file) => {
    socket.emit("html", getHTML(file));
  });

  socket.on("addNote", (type, note, file) => {
    switch(type) {
      case "h1":
      case "h2":
      case "h3":
        editJSON(file, {"type":type,"text":note.slice(type.slice(1))});
        break;
      case "quote":
        editJSON(file, {"type":"quote","text":note.slice(1)});
        break;
      case "ul":
        if (JSON.parse(fs.readFileSync(file))["order"].findLast(returnsTrue)["type"] === "ul") {
          appendJSON(file, "ul", {"type":"li","text":note.slice(1)});
          console.log("Adding to list");
        } else {
          editJSON(file, {
            "type":"ul",
            "contents": [
              {"type":"li", "text":note.slice(1)}
            ]
          });
        }
        break;
      case "p":
        editJSON(file, {"type":"p","text":note});
        break;
      default:
        console.log("error");
    }
    socket.emit("html", getHTML(file));
  });

  socket.on("del", (file, element) => {
    var currJSON = JSON.parse(fs.readFileSync(file));
    currJSON["order"].splice(element, 1);
    fs.writeFileSync(file, JSON.stringify(currJSON));
  });
});