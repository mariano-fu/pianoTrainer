// event.code is the PHYSICAL key, so this works on any layout
// (on a Spanish keyboard, the Ñ key still reports "Semicolon").
const KEY_TO_PITCH = {
    KeyA: "C4", KeyW: "C#4", KeyS: "D4", KeyE: "D#4", KeyD: "E4",
    KeyF: "F4", KeyT: "F#4", KeyG: "G4", KeyY: "G#4", KeyH: "A4",
    KeyU: "A#4", KeyJ: "B4", KeyK: "C5", KeyO: "C#5", KeyL: "D5",
    KeyP: "D#5", Semicolon: "E5",
};

//turns a key code into the letter shown on the piano key
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
    entries.forEach(([code, pitch]) => {
        const key = createKey(code, pitch)
        keyboard.append(key)
    });

}

renderKeyboard()


// find a key from its pitch
function findKey(pitch) {
    return document.querySelector(`[data-pitch="${pitch}"]`);
}


//sound

//the browser's sound engine, this stays silent until the user interacts
const audio = new AudioContext();
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


//converts a pitch name to it's midi number 
function midiOf(pitch) {                 // "C#4" -> 61
    const octave = Number(pitch.slice(-1));
    return (octave + 1) * 12 + NAMES.indexOf(pitch.slice(0, -1));
}

function playTone(pitch) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = 440 * 2 ** ((midiOf(pitch) - 69) / 12);
    gain.gain.setValueAtTime(0.3, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1); // fade out
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 1);
}

//press and release
function pressKey(pitch) {
    audio.resume();
    playTone(pitch)
    findKey(pitch).classList.add("pressed");
}

function releaseKey(pitch) {
    findKey(pitch).classList.remove("pressed");
}

//keyboard input
document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const pitch = KEY_TO_PITCH[event.code];
    if (!pitch) return;
    pressKey(pitch);

});

document.addEventListener("keyup", (event) => {
    const pitch = KEY_TO_PITCH[event.code];
    if (pitch) releaseKey(pitch);
});


//mouse input
const keyboard = document.querySelector("#keyboard")
let mousePitch = null;

keyboard.addEventListener("mousedown", (event) => {
    const pitch = event.target.dataset.pitch;
    if (!pitch) return;
    mousePitch = pitch;
    pressKey(pitch);
});

document.addEventListener("mouseup", () => {
    if (mousePitch === null) return;
    releaseKey(mousePitch);
    mousePitch = null;
});

// adds a "start" beat to every note: when it begins, counted from the song's start.
function withStartBeats(notes) {
  let beat = 0;
  return notes.map((note) => {
    const timed = { ...note, start: beat };
    beat += note.beats;
    return timed;
  });
}

// shows only active screen with given id, hides the other two
function showScreen(id) {
    document.querySelectorAll(".screen").forEach((screen) => {
        if (screen.id === id) {
            screen.classList.remove("hidden");
        } else {
            screen.classList.add("hidden")
        }
    });
}

//builds one menu entry: a list item holding a button for the song
function createSongItem(song) {
    const item = document.createElement("li")
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.songId = song.id;
    button.textContent = `${song.title} (${song.composer})`;
    item.append(button);
    return item;
}

//adds one entry per song in SONGS to the menu
function renderMenu() {
    const list = document.querySelector("#song-list");
    SONGS.forEach((song) => {
        list.append(createSongItem(song));
    });
}

renderMenu();
showScreen("menu-screen");