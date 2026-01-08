import {KEY_TYPES, state, levelState, KEY_SPRITES} from "./data.js";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";


//what can you do when you have no guarantees on the file format? ¯\_(ツ)_/¯
//it means every field is written as explicitly as reasonably possible

//also, lessoned learned: MAKE SURE the data flow comes from ONE authoritative source, becuase 
//now you have to deal with data.js AND objectArray as authoritative sources and... 
//what do you know you got a conflict where the data you want is in one but the code
//treated the other as authoritative.

function checkInvalidData(){
    for(const key in state.selectedFont){
        if(state.selectedFont[key] == null){alert(`error: no font selected for ${key}`); return true}
    }

    let levelIsNull = false;
    for(const item in state.levelFile){
        if(state.levelFile?.[item] == undefined) levelIsNull = true;
    }

    if(levelIsNull){alert(`error: no level file found`); return true}

    for(const keyType in KEY_TYPES){
        for(const inputInfo of KEY_TYPES[keyType]){
            const spriteName = `${keyType}-${inputInfo}`;
            if(state.imageFiles[spriteName] == undefined){
                console.log(`no image selected for ${keyType}-${inputInfo}, using default`);
                state.imageFiles[spriteName] = null; //for explicitness so that I know I've touched the data
            }
        }
    }
}

function levelFileGenerator(){
    const levelData = {
        BPM: null,
        songDuration: null,
        songStartOffset: null,
        LEVEL_X: 1280,
        LEVEL_Y: 720
    }

    let counter = 1; //to avoid group weirdness on group 0 idk if that bricks smth

    function convertToHexFF(num) {
        let scaledNum = Math.round(num * 255);
        let hexString = scaledNum.toString(16).toUpperCase();
        if (hexString.length === 1) {
            hexString = "0" + hexString;
        }
        return hexString;
    }

    function convertArrayToNum(array){
        const arrayCopy = [...array];

        const objectArray = arrayCopy.map((value, i) => {
            const num = parseFloat(value);
            return Number.isNaN(num) ? value : num;
        });

        return objectArray;
    }

    
    /*
    field reference:
    https://docs.google.com/document/d/1d8h0-AhM67KmtZOXScxXN3eLjj8Pkbqvjs-dGDhxrHs/edit?tab=t.0#heading=h.yvsrxdvvoyos
    magic value: "block" signifies it's a sprite 
    text: string contained in the block
    offset: 30 offset = 1 beat
    x: float (0,0 top left)
    y: float
    scaleX: float
    scaleY: float
    z-index: int
    duration: 30 offset = 1 beat
    color: RGBA
    rotation: float
    type: int 1=block, 2=text
    filename: string
    actions: optional string
    */
    function generateBlockString(data){
        const baseSprite = [];

        for(const item in data){if(typeof data[item] !== 'string'){console.log("error, expected string in generate block"); return "";}}
        
        const delim = "|";
        const opacity = convertToHexFF(data["opacity"])
        const schema = {
            magicString: "block",
            text:"",
            offset:data["offset"],
            x: data["x"],
            y: data["y"],
            scaleX: data["scaleX"],
            scaleY: data["scaleY"],
            zIndex: data["zIndex"],
            lifetime: data["lifetime"],
            group: data["group"],
            color: "FFFFFF" + opacity,
            rotation: data["rotation"],
            type: "1",
            imageFileName: data["filename"]
        }

        for(const key in schema){
            baseSprite.push(schema[key]);
        }

        return baseSprite.join(delim) + "|";
    }

    function handleSprite(objectArray, spriteDefenition){

        const baseBlockData = {
            offset: spriteDefenition.creationTime(objectArray).toString(),
            x: objectArray[4].toString(),
            y: objectArray[5].toString(),
            scaleX: spriteDefenition.scale ?? objectArray["scaleX"].toString(),
            scaleY: spriteDefenition.scale ?? "1.0",
            lifetime: spriteDefenition.lifetime(objectArray).toString(),
            filename: spriteDefenition.filename(objectArray),
            opacity: spriteDefenition.opacity ?? "1.0",
            rotation: spriteDefenition.rotation ?? objectArray["angle"].toString(),
            zIndex: spriteDefenition.zIndex,
            group: spriteDefenition.group?.(counter, objectArray)?.toString() ?? counter.toString()
        };

        let baseString = generateBlockString(baseBlockData);

        const newStrings = []
        for(const action of spriteDefenition.actions(objectArray)){
            newStrings.push(...action.fn(...action.args));
        }

        baseString = baseString + newStrings.join(`<?4CTi0N?>`);
        baseString = baseString + "|none"; //these blocks will never have a shader on them, so

        return baseString;
    }

    function generateNoteString(objectData){
        const dataCopy = [...objectData];
        dataCopy[6] = "0.0";
        dataCopy[7] = "0.0";
        let joined = dataCopy.join("|");
        joined = joined+"|"+counter.toString();
        return joined;
    }

    //look I know it's stupid to duplicate this thrice but I'm so paranoid about the fields and formatting diverging from each other in the future LOL
    /*
    field reference::
    https://docs.google.com/document/d/1d8h0-AhM67KmtZOXScxXN3eLjj8Pkbqvjs-dGDhxrHs/edit?tab=t.0#heading=h.ds1jwmtytquj
    magic value: "keyTouch" specifies that it's a key-touch object
    letter: char
    offset: 30 offset = 1 beat
    earlyLateTime: 30 offset = 1 beat
    x: float
    y: float
    scaleX: float
    scaleY: float
    z-index: int
    group: int
    */
    function handleKeyTouch(objectArray){
        const noteData = [];

        objectArray = convertArrayToNum(objectArray);
        objectArray[objectArray.length - 1] = counter;

        //dumping the actual objects on layer 1-2 to give a clean z-index for all the objects
        const hiddenNote = generateNoteString(objectArray);

        noteData.push(hiddenNote);
        const spriteData = KEY_SPRITES.KEY_TOUCH;
        for(const sprite in spriteData){
            const spriteDefenition = spriteData[sprite];
            noteData.push(handleSprite(objectArray, spriteDefenition));
        }

        return noteData;
    }

    /*
    field reference:
    https://docs.google.com/document/d/1d8h0-AhM67KmtZOXScxXN3eLjj8Pkbqvjs-dGDhxrHs/edit?tab=t.0#heading=h.ds1jwmtytquj
    magic value: "keyKeep" specifies that it's a key-keep object
    letter: char
    offset: 30 offset = 1 beat
    earlyLateTime: 30 offset = 1 beat
    x: float
    y: float
    scaleX: float
    scaleY: float
    z-index: int
    holdDuration: 30 offset = 1 beat
    isSliceMode: bool
    sliceX: float
    sliceY: float
    group: int
    */
    function handleKeyKeep(objectArray){
        const noteData = [];

        objectArray = convertArrayToNum(objectArray);
        objectArray[objectArray.length - 1] = counter;

        const hiddenNote = generateNoteString(objectArray);

        noteData.push(hiddenNote);
        const spriteData = KEY_SPRITES.KEY_KEEP;
        for(const sprite in spriteData){
            const spriteDefenition = spriteData[sprite];
            const modifiedObjectArrayCopy = spriteDefenition.transform
            ? spriteDefenition.transform(objectArray)
            : objectArray;
            noteData.push(handleSprite(modifiedObjectArrayCopy, spriteDefenition));
        }

        return noteData;
    }

    /*
    field reference:
    https://docs.google.com/document/d/1d8h0-AhM67KmtZOXScxXN3eLjj8Pkbqvjs-dGDhxrHs/edit?tab=t.0#heading=h.ds1jwmtytquj
    magic value: "keyHit" specifies that it's a key-keep object
    letter: char
    offset: 30 offset = 1 beat
    earlyLateTime: 30 offset = 1 beat
    x: float
    y: float
    scaleX: float
    scaleY: float
    z-index: int
    hitInterval: 30 offset = 1 beat
    repeatCount: int
    group: int
    */
    function handleKeyHit(objectArray){
        /*
        since there's no way to track stateful behaviour using actions, I'll insetad render a key-touch object
        for every repeat. So for example, if I have a 0.5 beat interval and 4 repeats, I'll spwan 4 key-touch objects with 0.25 early/late times each,
        centered at the midpoint between (the-1) repeats. That also gives a group per object
        so that I can have a "counter" decrement that's really just stacked sprites deleting themselves when the key-touch is pressed
        */
        const noteData = [];

        //need to pass in the repeat count into the objectArrayCopy, but doing so will modify the actual string that comes out... so try 
        //dumping the note count in, using it for the group, generating the scuffed block strings, and then removing the extenousous data
        //from the string
        objectArray = convertArrayToNum(objectArray);
        objectArray[objectArray.length - 1] = counter;

        const noteCount = objectArray[10];
        const hitInterval = objectArray[9]/(noteCount-1); //yes, seriously
        const offset = objectArray[2];

        //This part handles the base note. This thing should exist for as long as the note does.
        //also, I need all the stuff in the main base to overlap directly with the group of the last repeated note, so.
        const objectArrayCopyMain = [...objectArray];
        objectArrayCopyMain[9] = counter;
        objectArrayCopyMain[11] = noteCount;
        objectArrayCopyMain[12] = hitInterval;
        objectArrayCopyMain[0] = "keyTouch";
        let spriteData = KEY_SPRITES["KEY_HIT_MAIN"];
        for(const sprite in spriteData){
            const spriteDefenition = spriteData[sprite];
            const spriteString = handleSprite(objectArrayCopyMain, spriteDefenition);
            noteData.push(spriteString);
        }
        const hiddenBase = generateNoteString(objectArrayCopyMain);
        noteData.push(hiddenBase);
        //urg. repeated code no matter what but at least this way it's not super indented.
        
        

        //This part stacks a bunch of extra notes on top which each dissapear when hit/the timing window for the next number happens.
        //They should layer underneath the main note, and be added in reverse timing order so that the largest number layers on top.
        for(let i=noteCount-1; i>=1; i--){
            counter++;
            const objectArrayCopyRepeat = [...objectArray];
            objectArrayCopyRepeat[0] = "keyTouch";
            objectArrayCopyRepeat[2] = offset + i*hitInterval;
            objectArrayCopyRepeat[3] = hitInterval;
            objectArrayCopyRepeat[9] = counter;
            const hiddenRepeat = generateNoteString(objectArrayCopyRepeat);
            noteData.push(hiddenRepeat);
            spriteData = KEY_SPRITES["KEY_HIT_REPEAT_PULSE"];
            for(const sprite in spriteData){
                const spriteDefenition = spriteData[sprite];
                noteData.push(handleSprite(objectArrayCopyRepeat, spriteDefenition));
            }

            const index = noteCount - i;
            const digitCount = Math.floor(Math.log10(index)) + 1;
            //force icons to be 128x128
            const xStart = objectArrayCopyRepeat[4] - 16*((digitCount-1)/2); //icons are 64px so we just move over by 64 each digit
            objectArrayCopyRepeat.push("0");
            let value = index;
            spriteData = KEY_SPRITES["KEY_HIT_REPEAT_FONT"];
            for(let j=digitCount-1; j>=0; j--){
                objectArrayCopyRepeat[12] = (value % 10).toString(); //cursed
                objectArrayCopyRepeat[4] = xStart + j*32;
                objectArrayCopyRepeat[5] = objectArrayCopyRepeat[5]+32;
                for(const sprite in spriteData){
                    const spriteDefenition = spriteData[sprite];
                    noteData.push(handleSprite(objectArrayCopyRepeat, spriteDefenition));
                }
                value = Math.floor(value/10);
            }
        }


        return noteData;
    }

    function handleBlock(objectArray){
        const noteData = [objectArray.join("|")];
        return noteData;
    }

    const keyDispatch = {
        keyTouch: handleKeyTouch,
        keyKeep: handleKeyKeep,
        keyHit: handleKeyHit,
        block: handleBlock,
    }

    function parseConfig(){
        const levelMetadata = state.levelFile.levelMetadata.split("|");
        levelState.BPM = parseFloat(levelMetadata[7]);
        levelData["songDuration"] = parseFloat(levelMetadata[16]);

        const levelConfig = state.levelFile.levelConfig.split("|");
        levelData["songStartOffset"] = parseFloat(levelConfig[2]);
    }

    function generateLevelFile(){
        let generatedLevelDataArray = [];
        parseConfig();

        generatedLevelDataArray.push(state.levelFile.nitrori);
        generatedLevelDataArray.push(state.levelFile.levelMetadata);
        generatedLevelDataArray.push(state.levelFile.levelConfig);
        

        for(const line of state.levelFile.levelObjectData){
            const lineData = line.split("|");
            const objectType = lineData[0];

            const func = keyDispatch[objectType];
            generatedLevelDataArray.push(...func(lineData));
            //heads up, handleKeyHit() also needs to increment the counter.
            counter++;
        }

        const generatedLevelString = generatedLevelDataArray.join("\n");
        const generatedLevelBlob = new Blob([generatedLevelString], {type: "text/plain"});
        const generatedLevelURL = URL.createObjectURL(generatedLevelBlob);

        return generatedLevelBlob;
    }

    return {generateLevelFile}
}

function imageGenerator(){
    async function generateImages(){
        function canvasToBlob(canvas, type="image/png"){
            return new Promise(resolve => {
                canvas.toBlob(resolve, type);
            })
        }

        const imageBlobs = [];

        const CHARS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'0123456789'];
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");

        function drawChar(char){
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.font = '64px "Nunito", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(char, 64, 64);
        }

        async function generateAsyncFontBlobs(){
            for(const char of CHARS){
                drawChar(char);

                const blob = await canvasToBlob(canvas);
                const fileName = `Font${char}.png`;
                imageBlobs.push({data: blob, filename: fileName});
            }
        }

        await generateAsyncFontBlobs();

        //generate the repeated sprites

        await document.fonts.ready;

        //make an image url, don't forget to revokeObjectURL
        const imageUrl = await generateFileUrl("key-keep-sliceline");
        const img = new Image();

        await new Promise(resolve => {
            img.onload = resolve;
            img.src = imageUrl;
        });


        const canvasZero = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        canvas.getContext("2d").clearRect(0,0,1,1);
        const zeroBlob = await canvasToBlob(canvasZero);
        imageBlobs.push({data:zeroBlob, filename:`keyKeepSliceline_x0.png`});

        const canvases = [];
        for(let i=1; i<5; i++){
            const canvas = document.createElement("canvas");
            canvas.width = 128*i;
            canvas.height = 128;
            const ctx = canvas.getContext("2d");

            ctx.clearRect(0,0,canvas.width, canvas.height);
            for(let j=0; j<2**i; j++){
                ctx.drawImage(img, 128*(j), 0);
            }
            const blob = await canvasToBlob(canvas);
            const filename = `keyKeepSliceline_x${2**(i-1)}.png`;
            imageBlobs.push({data:blob, filename: filename});
        }

        //get blobs for all the images currently
        for(const image in state.imageFiles){
            const imageFile = state.imageFiles[image];
            if(!imageFile){
                const res = await fetch(`/default_assets/${image}.png`); 
                if(!res.ok){throw new Error(`Failed to find default image ${image}`)};
                const blob = await res.blob();
                imageBlobs.push({data:blob, filename: `${image}.png`})
            }else{
                imageBlobs.push({data:imageFile, filename:`${image}.png`});
            }
        }
        return imageBlobs;
    }

    return {generateImages}
}

async function generateFileUrl(fileName){
    const file = state.imageFiles[fileName];
    if(!file){
        return `/default_assets/${fileName}.png`;
    }

    return URL.createObjectURL(file);

}

export async function generateLevel(){
    if(checkInvalidData() === true){return;}

    const levelGenerator = levelFileGenerator();
    const levelFileBlob = levelGenerator.generateLevelFile();
    console.log("level file generated");

    const imageGen = imageGenerator();
    const images = await imageGen.generateImages();
    console.log("image files generated");

    const zip = new JSZip();

    zip.file("lvl.rsf", levelFileBlob);

    for(const image of images){
        zip.file(image.filename, image.data);
    }

    const zipBlob = await zip.generateAsync({type: "blob"});
    const downloadURL = URL.createObjectURL(zipBlob);
    const downloader = document.createElement("a");
    downloader.href = downloadURL;
    downloader.download = "data.zip";
    downloader.click();

    URL.revokeObjectURL(downloadURL)

    console.log("thing generated");


}