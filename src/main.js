import {mount} from "./ui/render.js";
import {state} from "./core/data.js";

document.getElementById("nojs").remove();

mount(state);

console.log("main.js ran");