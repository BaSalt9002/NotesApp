function getType(text) {
    let segment = text.substring(0,1);
    //$('h1').text(Boolean(segment === ">"));
    if (segment.search(`*`) === 0) {
        return "ul";
    } else if (segment.search(`#`) != -1) {
        return "h1";
    } else if (segment === ">") {
        return "quote";
    }
    callback(Boolean(segment === ">"));
}
$(document).ready(function() {
    $('h1').text(getType(">quote"));
})

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