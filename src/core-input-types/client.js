import checkbox from "./checkbox/widget"
import select from "./select/widget"
import text from "./text/widget"
import secure_string from "./secure-string/widget"
let getWidgets = function () {
    let widgets = [checkbox, select, text, secure_string];
    return widgets;
}

export default getWidgets