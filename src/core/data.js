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
    selectedFont: {"key-touch":null, "key-keep":null, "key-hit":null},
}

export const levelState = {
    BPM: null,
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
    //I'll just generate 4 versions that span 4 tiles (128px), 8 tiles, 16 tiles, and 32 tiles by default, and stretch the closest one to fit
    //which means I need to modify the filename here too.. uh I guess I append to objectData and extra "filename" field...

    //please never write this kind of code again
    const startX = objectData[4];
    const startY = objectData[5];

    const del = {x:objectData[11], y:objectData[12]};
    const scalingRatio = Math.hypot(del.x, del.y)/128.0;
    const step = 1;
    const nearestPow2 = 2 ** (Math.round(Math.log2(scalingRatio) / step) * step); //gives the whole thing in multiples of sqrt(2), so 8 sprites from 1x to 32x
    const residualXScale = scalingRatio / nearestPow2;

    const midpoint = {x: del.x/2, y: del.y/2};
    const angle = Math.atan2(del.y, del.x);

    const spriteName = `keyKeepSliceline_x${nearestPow2}.png`
    return {
        x:startX + midpoint.x, y:startY + midpoint.y, angle:angle, scaleX:residualXScale*nearestPow2, spriteName:spriteName
    }
}

function timeToOffset(ms){
    return ms * levelState.BPM / 2000.0;
}

export const KEY_SPRITES = {
    KEY_TOUCH:{
        base:{
            filename:obj=>`key-touch-base.png`,
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
            filename:obj=>`key-touch-approach.png`,
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
            filename:obj=>`key-touch-overline.png`,
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
            filename:obj=>`key-touch-pulse.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn: appear, args:[1, 0.0]}, //instantly set opacity to 100% on press
            ])
        },
        font:{
            filename:obj=>`Font${obj[1].toUpperCase()}.png`, //uses the letter that's acutally being hit
            scale:"1.0",
            zIndex:"3",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: fadeIn, args:[obj[3]/2]},
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
            ])
        }
    },

    KEY_KEEP:{
        base:{
            filename:obj=>`key-keep-base.png`,
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
                { fn: move, args:[0, obj[11], obj[12], obj[9], obj[3]]} // move from start to end over the hold duration, with a delay of early/late time
            ])
        },
        approach:{
            filename:obj=>`key-keep-approach.png`,
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
                { fn: move, args:[0, obj[11], obj[12], obj[9], obj[3]]} // move from start to end over the hold duration, with a delay of early/late time
            ])
        },
        overline:{
            filename:obj=>`key-keep-overline.png`,
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
                { fn: move, args:[0, obj[11], obj[12], obj[9], obj[3]]} // move from start to end over the hold duration, with a delay of early/late time
            ])
        },
        pulse:{
            filename:obj=>`key-keep-pulse.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: appear, args:[1, 0.0]}, //instantly set opacity to 100% when hit
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn: move, args:[0, obj[11], obj[12], obj[9], obj[3]]} // move from start to end over the hold duration, with a delay of early/late time
            ])
        },
        shadow:{
            filename:obj=>`key-keep-shadow.png`,
            scale:"0.0",
            zIndex:"2",
            opacity:"1.0",
            rotation: "0.0",
            creationTime: obj => obj[2], //create at note timestamp
            lifetime: obj => obj[9]+timeToOffset(500), //exist for the length of duration time plus 1 beat buffer
            actions: obj =>([
                { fn:appear, args:[1, 0.0]}, //instantly set opacity to 100% when hit
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn:growOnHit, args:[obj[9], 1.0]}, //grow to 1x over the duration of the hold
                { fn:onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
                { fn:move, args:[0, obj[11], obj[12], obj[9], 0.0]} // move from start to end over the hold duration, with no delay
            ])
        },
        sliceline:{
            filename:obj=>obj[obj.length-1], //seriously, please never write code like this again, me.
            opacity:"1.0",
            zIndex:"1",
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
                copy["scaleX"] = scaleX; 
                copy["angle"] = angle*180/3.1415;
                copy.push(spriteName); //seriously, please never write code like this again, me. Next time we are using ONE auhtoritative source and labelling everything in an object
                return copy;
            }
        },
        font:{
            filename:obj=>`Font${obj[1].toUpperCase()}.png`, //uses the letter that's acutally being hit
            scale:"1.0",
            zIndex:"3",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: fadeIn, args:[obj[3]/2]},
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn: appear, args:[0, obj[3]]}, //instantly set opacity to 100%
                { fn: move, args:[0, obj[11], obj[12], obj[9], obj[3]]} // move from start to end over the hold duration, with a delay of early/late time
            ])
        },
    },
    KEY_HIT_MAIN:{
        base:{
            filename:obj=>`key-hit-base.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            group: (counter, obj) => counter + 1,
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3]+timeToOffset(500)+obj[11]*obj[12], //exist for the length of the early/late time + 500ms buffer + total repeat timespan
            actions: obj => ([
                { fn: fadeIn, args:[obj[3] / 2] }, //fade in over half the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 1.5] }, //grow to 1.5x, fade over 250ms
                { fn: onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        approach:{
            filename:obj=>`key-hit-approach.png`,
            scale:"2.0",
            zIndex:"2",
            opacity:"0.0",
            rotation: "0.0",
            group: (counter, obj) => counter,
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus the early/late time
            lifetime: obj => obj[3], //exist for the length of early/late time
            actions: obj =>([
                { fn: fadeIn, args:[obj[3]] }, //fade in over the early/late time
                { fn: shrinkIn, args:[obj[3]] }, //shrink in over the early/late time
                { fn: onHit, args:[timeToOffset(250).toString(), 2.5]}, //grow to 2.5x, fade over 250ms
            ])
        },
        overline:{
            filename:obj=>`key-hit-overline.png`,
            scale:"1.0",
            zIndex:"2",
            opacity:"1.0",
            rotation: "0.0",
            group: (counter, obj) => counter + 1,
            creationTime: obj => obj[2] - obj[3], //create at note timestamp
            lifetime: obj => obj[3]+timeToOffset(500)+obj[11]*obj[12], //exist for the length of early/late time plus 1 beat buffer
            actions: obj =>([
                { fn:appear, args:[0, obj[3]]}, //instantly set opacity to 100% when the early/late time passes
                { fn:onHit, args:[timeToOffset(250).toString(), 1.5]}, //grow to 1.5x, fade over 250ms
                { fn:onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
            ])
        },
        pulse:{
            filename:obj=>`key-hit-pulse.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            group: (counter, obj) => counter,
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]+timeToOffset(500)+obj[11]*obj[12], //exist for the length of the early/late time + 500ms buffer + total repeat timespan
            actions: obj =>([
                { fn: appear, args:[1, 0.0]}, //instantly set opacity to 100% when hit
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
            ])
        },
        shadow:{
            //this needs to appear and repeat the correct # of times
            filename:obj=>`key-hit-shadow.png`,
            scale:"0.0",
            zIndex:"2",
            opacity:"1.0",
            rotation: "0.0",
            group: (counter, obj) => counter + 1,
            creationTime: obj => obj[2] - obj[3], //create at note timestamp
            lifetime: obj => obj[3]+timeToOffset(500)+obj[11]*obj[12], //exist for the length of repeats plus 1 beat buffer
            actions: obj =>([
                { fn:appear, args:[1, 0.0]}, //instantly set opacity to 100% when hit
                { fn:repeatGrow, args:[obj[11]-1, obj[12], obj[3]]}, //grow to 1x, repeated the noteCount times over hitInterval, but delay that animation by the early/late time
                { fn:onMiss, args:[timeToOffset(500).toString()] }, //play the miss animation over 500ms
                { fn:onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
            ])
        },
        font:{
            filename:obj=>`Font${obj[1].toUpperCase()}.png`, //uses the letter that's acutally being hit
            scale:"1.0",
            zIndex:"4", //the letter should layer on top of all the numbers
            opacity:"0.0",
            rotation: "0.0",
            group: (counter, obj) => counter,
            creationTime: obj => obj[2] - obj[3], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]+timeToOffset(500)+obj[11]*obj[12] + 60, //exist for the length of the early/late time + 500ms buffer + total repeat... plus 60? idk why this seems to work but okay
            actions: obj =>([
                { fn: fadeIn, args:[obj[3]/2]},
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
                { fn: appear, args:[0, obj[3]]}, //instantly set opacity to 100%
            ])
        },
    },
    KEY_HIT_REPEAT_FONT:{
        font:{
            filename:obj=>`Font${obj[12]}.png`, //uses the letter that's acutally being hit
            scale:"0.5",
            zIndex:"3",
            opacity:"1.0",
            rotation: "0.0",
            group: (counter, obj) => counter,
            creationTime: obj => obj[2], //create at note timestamp minus early/late time
            lifetime: obj => obj[3], //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: onHit, args:[timeToOffset(0).toString(), 1.5]}, //grow to 3x, fade over 0ms
            ])
        },
    },
    KEY_HIT_REPEAT_PULSE:{
        pulse:{
            filename:obj=>`key-hit-pulse.png`,
            scale:"1.0",
            zIndex:"1",
            opacity:"0.0",
            rotation: "0.0",
            creationTime: obj => obj[2], //create at note timestamp minus early/late time
            lifetime: obj => obj[3]*2+timeToOffset(500), //exist for the length of early/late time + 500ms buffer
            actions: obj =>([
                { fn: appear, args:[1, 0.0]}, //instantly set opacity to 100% when hit
                { fn: onHit, args:[timeToOffset(100).toString(), 1.5]}, //grow to 3x, fade over 100ms
            ])
        }
    }
}

function move(moveType, moveX, moveY, moveDuration, moveStartDelay){
    const moveStr = `move<?D1V?>${moveType}<?D1V?>${moveStartDelay}<?D1V?>${moveDuration}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>${moveX}<?D1V?>${moveY}`;
    return[moveStr];
}

function growOnHit(growTime, growScale){
    const sizeStr = `size<?D1V?>0<?D1V?>0.0<?D1V?>${growTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>${growScale}<?D1V?>${growScale}`;
    return [sizeStr];
}
function fadeIn(fadeInTime){
    const opacityStr = `trans<?D1V?>0<?D1V?>0.0<?D1V?>${fadeInTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0`;
    return [opacityStr];
}

function onHit(onHitTime, growScale){
    const opacityStr = `trans<?D1V?>1<?D1V?>0.0<?D1V?>${onHitTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0`;
    const sizeStr = `size<?D1V?>1<?D1V?>0.0<?D1V?>${onHitTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>${growScale}<?D1V?>${growScale}`;
    const deleteStr = `destroy<?D1V?>1<?D1V?>${onHitTime}`;
    return [opacityStr, sizeStr, deleteStr];
}

function onMiss(onMissTime){
    const opacityStr = `trans<?D1V?>4<?D1V?>0.0<?D1V?>${onMissTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0`;
    const redStr = `color<?D1V?>4<?D1V?>0.0<?D1V?>${onMissTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0<?D1V?>0.0<?D1V?>0.0`;
    const moveStr = `move<?D1V?>4<?D1V?>0.0<?D1V?>${onMissTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>0.0<?D1V?>128.0`; //assume that sprites are 128x128 on the pixel grid, but honestly it's whatever if they add a larger sprite and the move is smaller
    const destroyStr = `destroy<?D1V?>4<?D1V?>${onMissTime}`;
    return[opacityStr, redStr, moveStr, destroyStr];
}

function shrinkIn(shrinkInTime){
    const sizeStr = `size<?D1V?>0<?D1V?>0.0<?D1V?>${shrinkInTime}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0<?D1V?>1.0`
    return [sizeStr];
}

function appear(type, delay){
    const opacityStr = `trans<?D1V?>${type}<?D1V?>0.0<?D1V?>${delay}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0`;
    return [opacityStr];
}

//block||0.0|512.0|392.0|1.0|1.0|0|450.0|-1|ffffffff|0.0|0||
// size<?D1V?>0<?D1V?>0.0<?D1V?>0.0<?D1V?>11.0<?D1V?>1<?D1V?>30.0<?D1V?>0.0<?D1V?>0.0
//<?4CTi0N?>size<?D1V?>0<?D1V?>0.0<?D1V?>30.0<?D1V?>11.0<?D1V?>1<?D1V?>0.0<?D1V?>1.0<?D1V?>1.0
//|none
function repeatGrow(repeatCount, repeatDuration, repeatStartDelay){
    //set size to zero, then grow over repeatDuration to size=100%
    const growString = `size<?D1V?>0<?D1V?>${repeatStartDelay}<?D1V?>${repeatDuration*repeatCount}<?D1V?>1.0<?D1V?>1<?D1V?>0.0<?D1V?>${1.0*repeatCount}<?D1V?>${1.0*repeatCount}`;
    const resetString = `size<?D1V?>0<?D1V?>${repeatStartDelay}<?D1V?>0.0<?D1V?>${repeatCount}<?D1V?>1<?D1V?>${repeatDuration}<?D1V?>0.0<?D1V?>0.0`;
    return [growString, resetString];

}
//need to actually add quicksand to the loaded content