// event.code is the PHYSICAL key, so this works on any layout
// (on a Spanish keyboard, the Ñ key still reports "Semicolon").
const KEY_TO_PITCH = {
  KeyA: "C4", KeyW: "C#4", KeyS: "D4", KeyE: "D#4", KeyD: "E4",
  KeyF: "F4", KeyT: "F#4", KeyG: "G4", KeyY: "G#4", KeyH: "A4",
  KeyU: "A#4", KeyJ: "B4", KeyK: "C5", KeyO: "C#5", KeyL: "D5",
  KeyP: "D#5", Semicolon: "E5",
};

function labelFor(code) {
  if (code === "Semicolon") {
    return ";";
  }
  return code.replace("Key", "");
}

// key map and createKey function
function createKey(code, pitch) {
  const key = document.createElement("button");
  key.type = "button";

  key.classList.add("key");
  if (pitch.includes("#")) {
    key.classList.add("black");
  } else {
    key.classList.add("white");
  }

  key.dataset.pitch = pitch;
  key.textContent = labelFor(code);

  return key;
}

// piano keys render from key map
function renderKeyboard() {
   const keyboard = document.querySelector('#keyboard')
   const entries = Object.entries(KEY_TO_PITCH)
   entries.forEach(([code,pitch]) => {
    const key = createKey(code,pitch)
    keyboard.append(key)
   });

}

renderKeyboard()

// find a key from its pitch
function findKey(pitch) {
    return document.querySelector(`[data-pitch="${pitch}"]`);
}

//press and release
function pressKey(pitch) {
    findKey(pitch).classList.add("pressed");
}

function releaseKey(pitch) {
    findKey(pitch).classList.remove("pressed");
}

//keyboard input
document.addEventListener("keydown", (event) => {
    if (event.repeat) return ;
    const pitch = KEY_TO_PITCH[event.code];
    if (!pitch) return;
    pressKey(pitch);

});

document.addEventListener("keyup", (event) => {
    const pitch = KEY_TO_PITCH[event.code];
    if (pitch) releaseKey(pitch);
});

