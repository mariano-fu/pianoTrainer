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
    judgeKey(pitch)
}

function releaseKey(pitch) {
    findKey(pitch).classList.remove("pressed", "wrong");
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

//one listener for the whole list (event delegation)
document.querySelector("#song-list").addEventListener("click", (event) => {
    const songId = event.target.dataset.songId;
    if (!songId) return;
    const song = SONGS.find((candidate) => candidate.id === songId);
    startSong(song);
    updateHud();
});

// current game state
const state = {
    mode: "menu", // menu, song, free or results
    song: null, // current song
};

//height of one beat in pixels
const PX_PER_BEAT = 120;

// empty beats before the first note arrives
const LEAD_IN_BEATS = 4;

const lane = document.querySelector("#lane");

// one div per note, same order as the notes
let blocks= [];

//how far the song has scrolled in beats
let songBeat = 0;

//the note the player must hit next 
let nextIndex = 0;

//timestamp of previous frame
let lastTime = null;

//id of pending frame, so it can be canceled
let frameId = null;

let misses = 0;

function createBlock(note) {
    const key = findKey(note.pitch);
    const block = document.createElement("div");
    block.classList.add("note");
    block.style.height = `${note.beats * PX_PER_BEAT}px`;
    block.style.width = `${key.offsetWidth}px`;
    block.style.left = `${key.offsetLeft - lane.offsetLeft}px`;
    return block;
}

function renderBlocks() {
    lane.innerHTML = "";
    blocks = state.song.notes.map((note) => {
        const block = createBlock(note);
        lane.appendChild(block);
        return block;
    });
}

function draw() {
    const hitY = lane.offsetHeight;
    blocks.forEach((block, i) => {
        const note = state.song.notes[i];
        const bottom = hitY - (note.start - songBeat) * PX_PER_BEAT;
        const top = bottom - note.beats * PX_PER_BEAT;
        block.style.transform = `translateY(${top}px)`;
    });
}

//runs once per repaint: advances songBeat by the time that passed 
// holds it at the next note's start, then redraws and schedules the next frame
function frame(now) {
    if (lastTime !== null) {
        const seconds = Math.min((now - lastTime) / 1000, 0.1);
        songBeat += seconds * (state.song.bpm / 60);
        const next = state.song.notes[nextIndex];
        if (next && songBeat >= next.start) songBeat = next.start;
    }
    lastTime = now;
    draw()
    frameId = requestAnimationFrame(frame);
}

function stopLoop() {
    cancelAnimationFrame(frameId);
    frameId = null;
}

// stops any running loop, resets the song to its lead-in, and schedules the first frame
function startLoop() {
    stopLoop();
    songBeat = -LEAD_IN_BEATS;
    nextIndex = 0;
    lastTime = null;
    misses = 0;
    frameId = requestAnimationFrame(frame);
}

function startSong(song) {
    state.mode = "song";
    state.song = {...song, notes: withStartBeats(song.notes) };
    document.querySelector("#song-title").textContent = song.title;
    document.querySelector("#lane").classList.remove("hidden");
    showScreen("in-game-screen");
    renderBlocks();
    draw();
    startLoop();
    updateHud();
    
}

function startFreePlay() {
    stopLoop();
    state.mode = "free";
    state.song = null;
    updateHud();
    document.querySelector("#song-title").textContent = "Free Play";
    document.querySelector("#lane").classList.add("hidden");
    showScreen("in-game-screen")
}

document.querySelector("#free-play").addEventListener("click", startFreePlay);

function isWaiting() {
    const next = state.song.notes[nextIndex];
    return next !== undefined && songBeat >= next.start;
}

// in song mode, checks a pressed key against the note waiting at the line
function judgeKey(pitch) {
    if (state.mode !== "song") return;
    if (!isWaiting()) return;

    const next = state.song.notes[nextIndex];
    if (pitch === next.pitch) {
        blocks[nextIndex].classList.add("hit");
        nextIndex++;
    } else {
        misses++;
        findKey(pitch).classList.add("wrong");
    }

    updateHud();
    if (nextIndex === state.song.notes.length) finishSong();
}

//shows notes played and missed in the HUD, clears both outside song mode
function updateHud() {
    const progress = document.querySelector("#progress");
    const missesText = document.querySelector("#misses");
    if (state.mode !== "song") {
        progress.textContent = "";
        missesText.textContent = "";
        return;
    }
    progress.textContent = `${nextIndex} / ${state.song.notes.length}`;
    missesText.textContent = `Misses: ${misses}`;
}


// stops the loop and shows the results screen
function finishSong () {
    stopLoop();
    const total = state.song.notes.length;
    document.querySelector("#results-heading").textContent = `${state.song.title}: complete`;
    document.querySelector("#final-stats").textContent = `Notes: ${total} - Misses: ${misses}`;
    state.mode = "results";
    showScreen("results-screen");
}




function backToMenu() {
    stopLoop();
    state.mode = "menu"
    state.song = null;
    showScreen("menu-screen");
}

document.querySelector("#back-to-menu-button").addEventListener("click", backToMenu);
document.querySelector("#back-to-menu-button-results").addEventListener("click", backToMenu);
document.querySelector("#play-again").addEventListener("click", () => {
    startSong(state.song);
});

renderMenu();
showScreen("menu-screen");

