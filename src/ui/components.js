import {update} from "./render.js";
import {KEY_TYPES} from "../core/data.js";
import {state} from "../core/data.js";
import { generateLevel } from "../core/levelGenerator.js";

function MainBox(){
    return{
        type: "div",
        properties: {className: "main-box"},
        children: [UploadPanel(), FontBar(), FileButton()]
    };
}

function FontBar(){
    return{
        type: "div",
        properties: {className: "font-bar"},
        children: [FontUploadButton()]
    };
}

function FontUploadButton(){
    return{
        type: "button",
        properties: {className: "font-upload-button"},
        innerHTML: "Upload Font",
        children: []
    };
}

function UploadButton(keyType, inputInfo){
    const activeUpload = `${keyType}-${inputInfo}`

    return{
        type:"button",
        children:[],
        innerHTML: "select png...",
        properties:{ 
            className: `${keyType}-${inputInfo}-button`,
        },
        onclick: () => {
            state.activeUpload = activeUpload;
            console.log(activeUpload);
            document.getElementById("file-upload-handler").click();
        },
    }
}

function KeyInfoBox(keyType, inputInfo){
    return{
        type:"div",
        children:[UploadButton(keyType, inputInfo)],
        innerHTML: `choose a file for ${keyType} ${inputInfo}`,
        properties:{className: `${keyType}-${inputInfo}-box`}
    }
}

function FileButton(){
    const clickBehaviour = () => {
        state.activeUpload = "level-file";
        console.log("level file is selecting:");
        document.getElementById("file-upload-handler").click();
    }

    return{
        type: "button",
        properties: {className: "file-upload-button"},
        innerHTML: "Set the level file...",
        onClick: clickBehaviour
    }
}

function UploadPanel(){
    return{
        type: "div",
        properties: {className: "upload-panel"},
        children: Object.keys(KEY_TYPES)
        .map(
            keyType => KeyTypeBox(keyType)
        )
    }
}

function FontOption(keyType, fontName){
    //will implement for custom fonts later
    return{
        type:"option",
        properties: {className: `font-option-${fontName}`},
        innerHTML: `${fontName}`,
        children: []
    }
}

function Font(keyType){
    const fonts = [];

    const changeBehvaiour = (event) => {
        state.selectedFont[keyType] = event.target.value;
        console.log(`${keyType} chose font ${event.target.value}`);
    };

    for(const font of state["loadedFonts"]){
        fonts.push(FontOption(keyType, font));
    };

    fonts[0].properties["selected"] = ''; //select Dosis by default
    state.selectedFont[keyType] = fonts[0].innerHTML;

    return{
        type:"select",
        properties: {className: `${keyType}-font-button`},
        children:fonts,
        onChange: changeBehvaiour
    };
}

function KeyTypeBox(keyType){
    const font_button = [{
        type:"div",
        properties: {className: `${keyType}-font-box`},
        innerHTML: `choose a font for ${keyType}`,
        children: [Font(keyType)]
    }]

    return{
        type:"div",
        properties: {className: `${keyType}-box`},
        children: KEY_TYPES[keyType].map(
            inputInfo => KeyInfoBox(keyType, inputInfo)
        ).concat(font_button)
    }
}

function RenderingBox(){
    return{
        type: "div",
        properties: {className: "rendering-box"},
        innerHTML: "image preview",
        children: [KeyTouchCanvas(), KeyKeepCanvas(), KeyHitCanvas()]
    };
}

function KeyTouchCanvas(){
    return{
        type: "canvas",
        properties: {className: "key-touch-canvas"},
        children: []
    };
}

function KeyKeepCanvas(){
    return{
        type: "canvas",
        properties: {className: "key-keep-canvas"},
        children: []
    };
}

function KeyHitCanvas(){
    return{
        type: "canvas",
        properties: {className: "key-hit-canvas"},
        children: []
    };
}

function FileUploadHandler(){
    const onChangeBehaviour = async (event) => {
        const file = event.target.files[0];
        if(!file) return;
        if(state.imageFiles === null) state.imageFiles = {};
        if(state.activeUpload === "level-file"){
            //handle level file, can pull this out into a factory later if I need file version support
            if(!file.name.toLowerCase().endsWith(".rsf")){
                alert("please ensure the upload is a .rsf file!");
                event.target.value = "";
                return
            }
            state.levelFile.file = file;
            const rsfData = await file.text();
            const rsfLines = rsfData.split(/\r?\n/);
            //okay well I can't just delete this string, how would Nitro-Ri know if everything's okay?
            state.levelFile.nitrori = rsfLines.shift();
            state.levelFile.levelMetadata = rsfLines.shift();
            state.levelFile.levelConfig = rsfLines.shift();
            state.levelFile.levelObjectData = rsfLines;
            state.levelFile.levelName = state.levelFile.levelMetadata.split("|")[1];
        }
        else{
            //handle images
            if(file.type !== "image/png"){
                alert("please ensure the upload is a .png format!");
                event.target.value = "";
                return
            }
            state.imageFiles[state.activeUpload] = file;
        }
        console.log(`file uploaded: ${file}, ${state.activeUpload}`);
        update();
        event.target.value = "";
    }

    return{
        type: "input",
        properties: {type: "file", accept: ".rsf,image/png", id:"file-upload-handler"},
        children: [],
        onchange: onChangeBehaviour
    };
}

function MakeLevelButton(){
    const onClickBehaviour = () => {
        console.log("clicked");
        generateLevel();
    }

    return {
        type: "button",
        properties:{className: "make-level-button"},
        onclick: onClickBehaviour,
        innerHTML: "Generate Level File"
    }
}

export function App(){
    return{
        type: "div",
        properties: {className: "app-div"},
        children: [MainBox(), RenderingBox(), FileUploadHandler(), MakeLevelButton()]
    };
}