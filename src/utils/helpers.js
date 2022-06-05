
function containsObject(obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

function removeObject(obj, list) {

    for (let i of list)
        if (list[i] == obj)  
            list.splice(i, 1)
}

module.exports = {containsObject, removeObject}