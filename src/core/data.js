export const KEY_TYPES =
{
    "key-touch":["base", "approach","overline", "pulse"],
    "key-keep":["base", "approach", "overline", "pulse", "shadow", "sliceline"],
    "key-hit":["base", "approach", "overline", "pulse", "shadow"]
}

export const state = {
    uiState: "main",
    activeUpload: null,
    imageFiles: {},
    levelFile: {
        nitrori: null,
        levelMetadata: null,
        levelConfig: null,
        levelObjectData: null,
        levelName: null
    },
    loadedFonts: ["Dosis", "Nunito", "Quicksand"],
    customFonts: [],
    selectedFont: {"key-touch":null, "key-keep":null, "key-hit":null}
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
function computeSlicelineTransform(objectData){
    //comprimise: we strecth the sliceline sprite instead of tiling because otherwise there's gonna be like 200 sliceline sprites in the level folder.
    //I'll just generate 4 versions that span 4 tiles, 8 tiles, 16 tiles, and 32 tiles by default, and stretch the closest one to fit
    //which means I need to modify the filename here too.. uh I guess I append to objectData and extra "filename" field...

    //please never write this kind of code again
    const startX = objectData[11];
    const startY = objectData[12];
    const endX = objectData[11];
    const endY = objectData[12];

    const del = {x:endX - startX, y:endY - startY};
    const scalingRatio = Math.hypot(del.x, del.y)/32.0;
    const step = 0.5;
    const nearestPowSqrt2 = 2 ** (Math.round(Math.log2(scalingRatio) / step) * step); //gives the whole thing in multiples of sqrt(2), so 8 sprites from 1x to 32x
    const residualXScale = scalingRatio / nearestPowSqrt2;

    const midpoint = {x: del.x/2, y: del.y/2};
    const angle = Math.atan2(del.y, del.x);

    const spriteName = `keyKeepSliceline_x${nearestPowSqrt2}`
    return {
        x:midpoint.x, y:midpoint.y, angle:angle, scaleX:residualXScale, spriteName:spriteName
    }
}

function timeToOffset(ms){
    return ms * levelData.BPM / 2000.0;
}

export const KEY_SPRITES = {
    KEY_TOUCH:{
        base:{
            filename:obj=>`keyTouchBase.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3] * 2 + timeToOffset(500), //exist for twice the early/late time + 1 beat
            actions: obj => ([
                { fn: fadeIn, args:[obj[3] / 2] }, //fade in over half the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 1.5] }, //grow to 1.5x, fade over 250ms
                { fn: onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        approach:{
            filename:obj=>`keyTouchApproach.png`,
            scale:"2.0",
            zIndex:"2",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3], //exist for the length of early/late time
            actions: obj =>([
                { fn: fadeIn, args:[obj[3]] }, //fade in over the early/late time
                { fn: shrinkIn, args:[obj[3]] }, //shrink in over the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 2.5]}, //grow to 2.5x, fade over 250ms
            ])
        },
        overline:{
            filename:obj=>`keyTouchOverline.png`,
            scale:"1.0",
            zIndex:"2",
            opacity:"1.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp
            lifetime: obj => obj[3]+timeToOffset(500), //exist for the length of early/late time plus 1 beat buffer
            actions: obj =>([
                { fn: appear, args:[0, obj[3]]}, //instantly set opacity to 100% when the early/late time passes
                { fn:onHit, args:[timeToOffset(250).toString(), 1.5]}, //grow to 1.5x, fade over 250ms
                { fn:onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        pulse:{
            filename:obj=>`keyTouchPulse.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn: appear, args:[2, 0.0]}, //instantly set opacity to 100% on press
            ])
        },
        font:{
            filename:obj=>`keyTouchFont${obj[1].toUpperCase()}.png`, //uses the letter that's acutally being hit
            scale:"1.0",
            zIndex:"3",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
            ])
        }
    },

    KEY_KEEP:{
        base:{
            filename:obj=>`keyKeepBase.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3] * 2 + timeToOffset(500), //exist for twice the early/late time + 1 beat
            actions: obj => ([
                { fn: fadeIn, args:[obj[3] / 2] }, //fade in over half the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 1.5] }, //grow to 1.5x, fade over 250ms
                { fn: onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        approach:{
            filename:obj=>`keyKeepApproach.png`,
            scale:"2.0",
            zIndex:"2",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3], //exist for the length of early/late time
            actions: obj =>([
                { fn: fadeIn, args:[obj[3]] }, //fade in over the early/late time
                { fn: shrinkIn, args:[obj[3]] }, //shrink in over the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 2.5]}, //grow to 2.5x, fade over 250ms
            ])
        },
        overline:{
            filename:obj=>`keyKeepOverline.png`,
            scale:"1.0",
            zIndex:"2",
            opacity:"1.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp
            lifetime: obj => obj[3]+timeToOffset(500), //exist for the length of early/late time plus 1 beat buffer
            actions: obj =>([
                { fn:appear, args:[0, obj[3]]}, //instantly set opacity to 100% when the early/late time passes
                { fn:onHit, args:[timeToOffset(250).toString(), 1.5]}, //grow to 1.5x, fade over 250ms
                { fn:onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        pulse:{
            filename:obj=>`keyKeepPulse.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: appear, args:[2, 0.0]}, //instantly set opacity to 100% when hit
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
            ])
        },
        shadow:{
            filename:obj=>`keyKeepShadow.png`,
            scale:"0.0",
            zIndex:"2",
            opacity:"1.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp
            lifetime: obj => obj[3]+timeToOffset(500), //exist for the length of early/late time plus 1 beat buffer
            actions: obj =>([
                { fn:appear, args:[2, 0.0]}, //instantly set opacity to 100% when hit
                { fn:growOnHit, args:[obj[9], 1.0]}, //grow to 1x over the duration of the hold
                { fn:onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        sliceline:{
            filename:obj=>obj[obj.length-1], //seriously, please never write code like this again, me.
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3] * 2 + timeToOffset(500), //exist for twice the early/late time + 1 beat
            actions: obj => ([
                { fn: fadeIn, args:[obj[3] / 2] }, //fade in over half the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 1.5] }, //grow to 1.5x, fade over 250ms
                { fn: onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ]),
            //the cursed stuff, force myself to pass in xy and rotation if this shows up again
            transform: obj => {
                const copy = [...obj];
                const {x, y, angle, scaleX, spriteName} = computeSlicelineTransform(obj);
                copy[4] = x;
                copy[5] = y;
                copy[6] = scaleX;
                copy[10] = angle;
                copy.push(spriteName); //seriously, please never write code like this again, me.
                return copy;
            }
        },
        font:{
            filename:obj=>`keyKeepFont${obj[1].toUpperCase()}.png`, //uses the letter that's acutally being hit
            scale:"1.0",
            zIndex:"3",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn: appear, args:[0, obj[3]]}, //instantly set opacity to 100%
            ])
        },
    },

    KEY_HIT:{
        
    }
}

function growOnHit(growTime, growScale){
    const sizeStr = `size<?D1V?>0<?D1V?>0.0<?D1V?>${growTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>${growScale}<?D1V?>${growScale}`;
    return sizeStr;
}
function fadeIn(fadeInTime){
    const opacityStr = `trans<?D1V?>0<?D1V?>0.0<?D1V?>${fadeInTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0`;
    return [opacityStr];
}

function onHit(onHitTime, growScale){
    const opacityStr = `trans<?D1V?>2<?D1V?>0.0<?D1V?>${onHitTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0`;
    const sizeStr = `size<?D1V?>2<?D1V?>0.0<?D1V?>${onHitTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>${growScale}<?D1V?>${growScale}`;
    const deleteStr = `destroy<?D1V?>2<?D1V?>${onHitTime}`;
    return [opacityStr, sizeStr, deleteStr];
}

function onMiss(onMissTime){
    const opacityStr = `trans<?D1V?>4<?D1V?>0.0<?D1V?>${onMissTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0`;
    const redStr = `color<?D1V?>4<?D1V?>0.0<?D1V?>${onMissTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0<?D1V?>0.0<?D1V?>0.0`;
    const moveStr = `move<?D1V?>4<?D1V?>0.0<?D1V?>${onMissTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0<?D1V?>32.0`; //assume that sprites are 32x32 on the pixel grid, but honestly it's whatever if they add a larger sprite and the move is smaller
    const destroyStr = `destroy<?D1V?>4<?D1V?>${onMissTime}`;
    return[opacityStr, redStr, moveStr, destroyStr];
}

function shrinkIn(shrinkInTime){
    const sizeStr = `size<?D1V?>0<?D1V?>0.0<?D1V?>${shrinkInTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0<?D1V?>1.0`
    return [sizeStr];
}

function appear(type, delay){
    const opacityStr = `trans<?D1V?>${type}<?D1V?>0.0<?D1V?>${delay}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0`;
    return [opacityStr];
}
//need to actually add quicksand to the loaded content