function getType(text) {
    let segment = text.substr(0,4);
    $('h1').text(segment);
    if (segment.search("*")) {
        return "ul";
    } else if (segment.search("#")) {
        return "h1";
    } else if (segment.search(">")) {
        return "quote";
    }
    return "error in the getType() function";
}

let currLine = 0;
function lineCtrl(action, totalLines) {
    switch (action) {
        case "up":
            if (currLine > 0) {
                currLine--;
            }
            break;
        case "down":
            if (currLine < totalLines) {
                currLine++;
            } else {
                return "newline";
            }
            break;
        default:
            return "error";
    }
}