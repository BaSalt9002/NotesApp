const http = require('http');
const fs = require('fs');
const socket = require('socket.io');
const markdownit = require('markdown-it');
const md = markdownit();
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
let key = 'MySuperSecretKey';
key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

const encrypt = (buffer, key) => {
    // Create an initialization vector
    const iv = crypto.randomBytes(16);
    // Create a new cipher using the algorithm, key, and iv
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Create the new (encrypted) buffer
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

const decrypt = (encrypted, key) => {
   // Get the iv: the first 16 bytes
   const iv = encrypted.slice(0, 16);
   // Get the rest
   encrypted = encrypted.slice(16);
   // Create a decipher
   const decipher = crypto.createDecipheriv(algorithm, key, iv);
   // Actually decrypt it
   const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
   return result;
};

const plain = Buffer.from('Hello, world!');
console.log(encrypt(plain).toString());
console.log(decrypt(encrypt(plain)).toString());

function returnsTrue(){
  return Boolean(1===1);
}

function editJSON(file, content, location) {
  currJSON = JSON.parse(fs.readFileSync(file));
  if (location === -1) {
    currJSON["order"].push(content);
  } else {
    currJSON["order"].splice(location+1, 0, content);
  }
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
  console.log(req.cookies);
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

  socket.on("addNote", (type, note, file, location) => {
    switch(type) {
      case "h1":
      case "h2":
      case "h3":
        editJSON(file, {"type":type,"text":note.slice(type.slice(1))}, location);
        break;
      case "quote":
        editJSON(file, {"type":"quote","text":note.slice(1)}, location);
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
        editJSON(file, {"type":"p","text":note}, location);
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

  socket.on("newfile", (data, user) => {
    let filename = '';
    crypto.generateKey('hmac', { length: 64 }, (err, key) => {
      if (err) throw err;
      filename = key.export().toString('hex');
      console.log(filename);

      newJSON = {
        "name":data,
        "order": [
          {"type":"h1","text":data}
        ]
      }

      fs.writeFileSync(("pages/" + filename + ".json"), JSON.stringify(newJSON));

      let users = fs.readFileSync("users.json");
      let userindex = 0;
      users = JSON.parse(users);
      for (i in users["users"]) {
        if (users["users"][i] === user) {
          userindex = i;
        }
      }
      users["users"][userindex]["info"]["files"].push({
        "location":("pages/" + filename + ".json"),
        "name":data
      });

      fs.writeFileSync("users.json", JSON.stringify(users));
    });
  });
  socket.on("getIP", () => {

  });
});