import {update} from "./render.js"

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

const KEY_TPYES = [
    {id: "key-touch"},
    {id: "key-keep"},
    {id: "key-hit"}
]

const INPUT_INFO = [
    {id: "base"},
    {id: "overline"},
    {id: "pulse"}
]

function UploadButton(state, keyType, inputInfo){
    const activeUpload = `${keyType.id}-${inputInfo.id}`

    return{
        type:"button",
        children:[],
        innerHTML: "select png...",
        properties:{
            className: `${keyType.id}-${inputInfo.id}-button`,
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
        innerHTML: `choose a file for ${keyType.id} ${inputInfo.id}`,
        properties:{className: `${keyType.id}-${inputInfo.id}-box`}
    }
}

function UploadPanel(state){
    return{
        type: "div",
        properties: {className: "upload-panel"},
        children: KEY_TPYES.map(
            keyType => KeyTypeBox(state, keyType)
        )
    }
}

function KeyTypeBox(state, keyType){
    const font_button = [{
        type:"div",
        properties: {className: `${keyType.id}-font-box`},
        innerHTML: `choose a font for ${keyType.id}`,
        children: [{
            type:"select",
            properties: {className: `${keyType.id}-font-button`, name: `choose a font for ${keyType.id}`},
            children:[]
        }]
    }]

    return{
        type:"div",
        properties: {className: `${keyType.id}-box`},
        children: INPUT_INFO.map(
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