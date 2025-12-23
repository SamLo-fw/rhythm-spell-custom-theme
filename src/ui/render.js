import { App } from "./components.js";
import {KEY_TYPES} from "../core/data.js";

//you are allowed to render the UI based on the state.

export function mount(state){
    parent = document.getElementById("app");
    mountTree(App(state), parent);
}

function mountTree(vnode, parent) {
  if (typeof vnode === "string") {
    parent.appendChild(document.createTextNode(vnode));
    return;
  }

  const element = document.createElement(vnode.type);

  if(vnode.innerHTML){
    element.innerHTML = vnode.innerHTML;
  }

  if (vnode.properties) {
    for (const [key, value] of Object.entries(vnode.properties)) {
      if (key === "className") element.className = value;
      else if (key === "onclick") element.onclick = value;
      else if (key === "onchange") element.onchange = value;
      else element.setAttribute(key, value);
    }
  }

  if (vnode.children) {
    for (const child of vnode.children) {
      mountTree(child, element);
    }
  }

  parent.appendChild(element);
}

export function update(state){
  handleCanvas(state);
  handleFontDropdown(state);
}

function drawFileToCanvas(canvas, file, context){
  if(!file) {console.log("error: file not found"); return};
  if(!canvas) {console.log("error: canvas not found"); return};

  const image = new Image();

  image.onload = ()=>{
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = image.width / image.height;

    let drawWidth, drawHeight;

    if (imgRatio > canvasRatio) {
      // image is wider
      drawWidth = canvas.width;
      drawHeight = canvas.width / imgRatio;
    } else {
      // image is taller
      drawHeight = canvas.height;
      drawWidth = canvas.height * imgRatio;
    }

    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    context.drawImage(image, x, y, drawWidth, drawHeight);

		URL.revokeObjectURL(image.src); 
  }

  image.src = URL.createObjectURL(file);
}

function handleCanvas(state){
  const boundingBox = document.getElementsByClassName("rendering-box")[0];

  for(const keyType of Object.keys(KEY_TYPES)){
    const canvas = document.getElementsByClassName(`${keyType}-canvas`)[0];
    if(!canvas) console.log(`no canvas found for ${keyType}`)
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    for(const fileType of KEY_TYPES[keyType]){
      const fileKey = `${keyType}-${fileType}`
      const file = state.files[fileKey];
      if(!file){console.log(`no file found for ${fileKey}`);}
      else drawFileToCanvas(canvas, file, context);
    }
  }
}

function handleFontDropdown(state){
  return;
}