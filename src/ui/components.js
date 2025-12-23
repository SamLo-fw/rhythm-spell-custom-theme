import {update} from "./render.js";
import {KEY_TYPES} from "../core/data.js";
import {state} from "../core/data.js";

function MainBox(state){
    return{
        type: "div",
        properties: {className: "main-box"},
        children: [UploadPanel(state), FontBar(state)]
    };
}

function FontBar(state){
    return{
        type: "div",
        properties: {className: "font-bar"},
        children: [FontUploadButton(state)]
    };
}

function FontUploadButton(state){
    return{
        type: "button",
        properties: {className: "font-upload-button"},
        innerHTML: "Upload Font",
        children: []
    };
}

function UploadButton(state, keyType, inputInfo){
    const activeUpload = `${keyType}-${inputInfo}`

    return{
        type:"button",
        children:[],
        innerHTML: "select png...",
        properties:{ 
            className: `${keyType}-${inputInfo}-button`,
            onclick: () => {
                state.activeUpload = activeUpload;
                console.log(activeUpload);
                document.getElementById("file-upload-handler").click();
            },
        }
    }
}

function KeyInfoBox(state, keyType, inputInfo){
    return{
        type:"div",
        children:[UploadButton(state, keyType, inputInfo)],
        innerHTML: `choose a file for ${keyType} ${inputInfo}`,
        properties:{className: `${keyType}-${inputInfo}-box`}
    }
}

function UploadPanel(state){
    return{
        type: "div",
        properties: {className: "upload-panel"},
        children: Object.keys(KEY_TYPES).map(
            keyType => KeyTypeBox(state, keyType)
        )
    }
}

function FontOption(state, keyType, fontName){
    //will implement for custom fonts later
    return{
        type:"option",
        properties: {className: `font-option-${fontName}`},
        innerHTML: `${fontName}`,
        children: []
    }
}

function Font

function KeyTypeBox(state, keyType){
    const font_button = [{
        type:"div",
        properties: {className: `${keyType}-font-box`},
        innerHTML: `choose a font for ${keyType}`,
        children: [{
            type:"select",
            properties: {className: `${keyType}-font-button`, name: `choose a font for ${keyType}`},
            children:[]
        }]
    }]

    return{
        type:"div",
        properties: {className: `${keyType}-box`},
        children: KEY_TYPES[keyType].map(
            inputInfo => KeyInfoBox(state, keyType, inputInfo)
        ).concat(font_button)
    }
}

function RenderingBox(state){
    return{
        type: "div",
        properties: {className: "rendering-box"},
        innerHTML: "image preview",
        children: [KeyTouchCanvas(state), KeyKeepCanvas(state), KeyHitCanvas(state)]
    };
}

function KeyTouchCanvas(state){
    return{
        type: "canvas",
        properties: {className: "key-touch-canvas"},
        children: []
    };
}

function KeyKeepCanvas(state){
    return{
        type: "canvas",
        properties: {className: "key-keep-canvas"},
        children: []
    };
}

function KeyHitCanvas(state){
    return{
        type: "canvas",
        properties: {className: "key-hit-canvas"},
        children: []
    };
}

function FileUploadHandler(state){
    return{
        type: "input",
        properties: {type: "file", accept: "image/png", id:"file-upload-handler", onchange: event => {
            const file = event.target.files[0];

            if(!file) return;
            if(state.files === null) state.files = {};
            if(file.type !== "image/png"){
                alert("please ensure the upload is a .png format!");
                event.target.value = "";
                return
            }
            
            state.files[state.activeUpload] = file;

            console.log(`file uploaded: ${file}, ${state.activeUpload}`);
            update(state);
            event.target.value = "";
        }},
        children: []
    };
}

export function App(state){
    return{
        type: "div",
        properties: {className: "app-div"},
        children: [MainBox(state), RenderingBox(state), FileUploadHandler(state)]
    };
}