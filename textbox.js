function getType(text) {
    let segment = text.substring(0,4);
    //$('h1').text(Boolean(segment === ">"));
    if (segment.search(`\\*`) != -1) {
        return "ul";
    } else if (segment.search(`\\###`) != -1) {
        return "h3";
    } else if (segment.search(`\\>`) != -1) {
        return "quote";
    } else if (segment.search(`\\##`) != -1) {
        return "h2";
    } else if (segment.search(`\\#`) != -1) {
        return "h1";
    }
    else {
        return "p";
    }
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