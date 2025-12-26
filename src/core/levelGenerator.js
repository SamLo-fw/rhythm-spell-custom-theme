import {KEY_TYPES, state, KEY_SPRITES} from "./data.js";


//what can you do when you have no guarantees on the file format? ¯\_(ツ)_/¯
//it means every field is written as explicitly as reasonably possible

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
            scaleX: data["scale"],
            scaleY: data["scale"],
            zIndex: data["zIndex"],
            lifetime: data["lifetime"],
            group: counter.toString(),
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
            scale: spriteDefenition.scale,
            lifetime: spriteDefenition.lifetime(objectArray).toString(),
            filename: spriteDefenition.filename(objectArray),
            opacity: spriteDefenition.opacity,
            rotation: spriteDefenition.rotation,
            zIndex: spriteDefenition.zIndex
        };

        let baseString = generateBlockString(baseBlockData);

        const newStrings = []
        for(const action of spriteDefenition.actions(objectArray)){
            newStrings.push(...action.fn(...action.args));
        }

        baseString = baseString + newStrings.join(`<?4CTi0N?>`)
        return baseString;
    }

    function generateNoteString(objectData){
        const dataCopy = [...objectData];
        dataCopy[6] = "0.0";
        dataCopy[7] = "0.0";
        const joined = dataCopy.join("|");
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

        objectArray = objectArray.map(
            (value, i) => i>=2 ? parseFloat(value) : value
        );

        //dumping the actual objects on layer 1-2 to give a clean z-index for all the objects
        const hiddenNote = generateNoteString(objectArray);

        noteData.push(hiddenNote);
        const spriteData = KEY_SPRITES.KEY_TOUCH;
        for(const sprite in spriteData){
            const spriteDefenition = spriteData[sprite];
            const modifiedObjectArrayCopy = spriteDefenition.transform
            ? spriteDefenition.transform(objectArray)
            : spriteDefenition;
            noteData.push(handleSprite(modifiedObjectArrayCopy, spriteDefenition));
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

        objectArray = objectArray.map(
            (value, i) => i>=2 ? parseFloat(value) : value
        );

        const hiddenNote = generateNoteString(objectArray);

        noteData.push(hiddenNote);
        const spriteData = KEY_SPRITES.KEY_KEEP;
        for(const sprite in spriteData){
            const spriteDefenition = spriteData[sprite];
            noteData.push(handleSprite(objectArray, spriteDefenition));
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
        centered at the midpoint between the repeats. That also gives a group per object
        so that I can have a "counter" decrement that's really just stacked sprites deleting themselves when the key-touch is pressed
        */
        const noteData = [];

        objectArray = objectArray.map(
            (value, i) => i>=2 ? parseFloat(value) : value
        );

        const noteCount = objectArray[10];
        const hitInterval = objectArray[11];

        for(const i=0; i<noteCount; i++){
            const objectArrayCopy = [...objectArray];
            objectArrayCopy[2] = hitInterval;
            objectArrayCopy[3] += i*hitInterval;
            const hiddenNote = generateNoteString(objectArray);
            noteData.push(hiddenNote);
        }


        const spriteData = KEY_SPRITES.KEY_KEEP;
        for(const sprite in spriteData){
            const spriteDefenition = spriteData[sprite];
            noteData.push(handleSprite(objectArray, spriteDefenition));
        }

        return noteData;
    }

    function handleKeyHit(objectArray){
        const noteData = [objectArray.join("|")];
        return noteData;
    }

    function handleBlock(){
        const noteData = [];
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
        levelData["BPM"] = parseFloat(levelMetadata[7]);
        levelData["songDuration"] = parseFloat(levelMetadata[16]);

        const levelConfig = state.levelFile.levelConfig.split("|");
        levelData["songStartOffset"] = parseFloat(levelConfig[2]);
    }

    function generateLevelFile(){
        const generatedLevelData = [];
        parseConfig();

        for(const line of state.levelFile.levelObjectData){
            const lineData = line.split("|");
            const objectType = lineData[0];

            const func = keyDispatch[objectType];
            generatedLevelData.concat(func(lineData));
            counter++;
        }

        return generatedLevelData;
    }

    return {generateLevelFile}
}

export function generateLevel(){
    if(checkInvalidData() === true){return;}

    const generator = levelFileGenerator();
    generator.generateLevelFile();
    console.log("level file generated");
}