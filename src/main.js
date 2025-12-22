import {mount} from "./ui/render.js";

document.getElementById("nojs").remove();

const state = {
    uiState: "main",
    activeUpload: null,
    files: {}
}

mount(state);

console.log("main.js ran");