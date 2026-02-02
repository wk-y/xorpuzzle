//@ts-check

const nameHeading = document.getElementById("nameHeading");

/**
 * @typedef {({
 *   name: string,
 *   keyGenerator: function(): Uint8Array,
 *   highlighting: boolean,
 *   textReadout: boolean,
 *   textInput: boolean,
 * })} Difficulty
 */

/**
 * @type Difficulty
 */
let difficulty = {
    name: "Standard",
    keyGenerator: () => generateRandomKey(4),
    highlighting: true,
    textReadout: true,
    textInput: true,
};
{
    const search = new URLSearchParams(window.location.search);
    const searchDifficulty = search.get("difficulty");
    switch (searchDifficulty) {
        case "easy":
            difficulty = {
                name: "Easy",
                keyGenerator: () => generateRandomKey(1),
                highlighting: true,
                textReadout: true,
                textInput: false,
            };
            nameHeading?.append(" (Easy)");
            break;

        case "hard":
            difficulty = {
                name: "Hard",
                keyGenerator: () => generateRandomKey(5 + Math.floor(Math.random() * 4)),
                highlighting: false,
                textReadout: true,
                textInput: false,
            };
            nameHeading?.append(" (Hard)");
            break;

        case "cypher":
            difficulty = {
                name: "Cypher's Mode",
                keyGenerator: () => generateRandomKey(5 + Math.floor(Math.random() * 4)),
                highlighting: false,
                textReadout: false,
                textInput: false,
            };
            nameHeading?.append(" (Cypher's Mode)");
            break;

        case "lexicon":
            difficulty = {
                name: "Lexicon",
                keyGenerator: () => new TextEncoder().encode(randomWord()),
                highlighting: true,
                textReadout: true,
                textInput: true,
            };
            nameHeading?.append(" (Lexicon Mode)");
            break;
    }
}
console.info("Difficulty: ", difficulty);

const hexDisplayWidth = 16;

function main() {
    const puzzleKey = difficulty.keyGenerator();

    if (!difficulty.highlighting) {
        document.body.classList.remove("highlight");
    }

    if (difficulty.textInput) {
        puzzleInput.setAttribute("placeholder", "Alice");
    }

    const puzzleIndex = Math.floor(Math.random() * corpus.length);
    let puzzle = new Puzzle(corpus[puzzleIndex], puzzleKey);

    /**
     * 
     * @param {Uint8Array} enteredKey
     */
    function updateDisplay(enteredKey) {
        puzzleViewer.innerHTML = "";
        puzzleViewer.append(PuzzleHexViewer.html(Puzzle.encode(puzzle.getEncoded(), enteredKey), hexDisplayWidth));
    }

    updateDisplay(new Uint8Array([0]));

    puzzleForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const input = getPuzzleInput();
        if (input == null) throw "invalid input";

        if (input.toString() == puzzle.key.toString()) {
            winGame();
        }

        const guessParagraph = document.createElement("p");
        const guessPre = document.createElement("pre");
        guessPre.append([...input].map(toHexPair).join(" "));
        guessParagraph.append(guessPre);

        guessLog.appendChild(guessParagraph);

        updateDisplay(input);
    });
}

/**
 * 
 * @param {number} length
 */
function generateRandomKey(length) {
    const key = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        for (; ;) {
            const byte = key[i] = Math.floor(Math.random() * 256);
            if (byte == 0 || byte == 0x20) continue; // no freebies!
            break;
        }
    }

    return key;
}

function randomWord() {
    /**
     * @type Set<string>
     */
    const set = new Set();
    for (const match of corpusElement.textContent.matchAll(/[A-z]{3,}/g)) {
        set.add(match[0]);
    }

    const lexicon = [...set.keys()];
    console.info("Lexicon: ", lexicon);

    return lexicon[Math.floor(Math.random() * lexicon.length)];
}

function winGame() {
    for (const element of puzzleForm.elements) {
        element.setAttribute("disabled", "");
    }

    document.body.classList.add("game-won");

    puzzleForm.append("You won!");
}

/**
 * @type HTMLDivElement
 */
// @ts-ignore
const puzzleViewer = document.getElementById("puzzleViewer");

/**
 * @type HTMLInputElement
 */
// @ts-ignore
const puzzleInput = document.getElementById("puzzleInput");

/**
 * @type HTMLFormElement
 */
// @ts-ignore
const puzzleForm = document.getElementById("puzzleForm");

/**
 * @type HTMLPreElement
 */
// @ts-ignore
const corpusElement = document.getElementById("corpus");
const corpus = corpusElement.textContent.split("\n\n").filter(x => x.length > 256);
console.info("Corpus size: ", corpus.length);

/**
 * @type HTMLDetailsElement
 */
// @ts-ignore
const guessLog = document.getElementById("guessLog");

function getPuzzleInput() {
    if (difficulty.textInput) {
        if (puzzleInput.value == "") return null;
        return new TextEncoder().encode(puzzleInput.value);
    }

    /**
     * @type number[]
     */
    const out = [];
    let digit = 0;
    let digitAcc = 0;

    for (let char of puzzleInput.value) {
        if (char.trim() == "") continue;
        char = char.toUpperCase();

        if (char < '0' || char > 'F') return null;

        digitAcc = (digitAcc << 4) + parseInt(char, 16);
        digit++;

        if (digit >= 2) {
            digit = 0;
            out.push(digitAcc);
        }
    }

    if (digit != 0) return null;

    if (out.length == 0) return null;

    return new Uint8Array(out);
}

function updatePuzzleInputValidity() {
    puzzleInput.setCustomValidity("");
    const input = getPuzzleInput();
    if (!input) {
        puzzleInput.setCustomValidity(
            difficulty.textInput
                ? "Enter some text"
                : "Enter valid hex"
        );
    }
};

puzzleInput.addEventListener("input", updatePuzzleInputValidity);
updatePuzzleInputValidity();

class Puzzle {
    static #encoder = new TextEncoder();

    /**
     * 
     * @param {string} text
     * @param {Uint8Array} key
     */
    constructor(text, key) {
        /**
         * @type string
         */
        this.text = text;
        /**
         * @type Uint8Array
         */
        this.key = key;
    }

    getPlainBytes() {
        return Puzzle.#encoder.encode(this.text);
    }

    getEncoded() {
        return Puzzle.encode(this.getPlainBytes(), this.key);
    }

    /**
     * 
     * @param {Uint8Array} data
     * @param {Uint8Array} key 
     */
    static encode(data, key) {
        const n = data.length;
        const m = key.length;
        const out = new Uint8Array(n);

        for (let i = 0; i < n; i++) {
            out[i] = data[i] ^ key[i % m];
        }

        return out;
    }
}

class PuzzleHexViewer {
    /**
     * 
     * @param {Uint8Array} bytes Bytes to display
     * @param {number} bytesPerLine Number of bytes per line
     */
    static html(bytes, bytesPerLine) {
        const n = bytes.length;
        const out = document.createElement("pre");

        let indexWidth = (n - (n % bytesPerLine)).toString(16).length;

        for (let i = 0; i < n;) {
            let rowIndex = i.toString(16).padStart(indexWidth, '0');

            /**
             * @type (string | HTMLSpanElement)[]
             */
            let hex = [];
            /**
             * @type (string | HTMLSpanElement)[]
             */
            let text = [];
            for (let j = 0; i < n && j < bytesPerLine; j++, i++) {
                const char = bytes[i];
                const tag = this.colorTag(char);

                {
                    const hexSpan = document.createElement("span");
                    hexSpan.textContent = toHexPair(char) + (j % 2 ? ' ' : '');
                    hexSpan.classList.add(tag);
                    hex.push(hexSpan);
                }

                {
                    const textSpan = document.createElement("span");
                    textSpan.classList.add(tag);
                    textSpan.textContent = tag == "color-green" ? String.fromCharCode(char) : ".";
                    text.push(textSpan);
                }
            }

            while (hex.length < bytesPerLine) {
                hex.push("   ");
            }

            out.append(rowIndex, ': ', ...hex);
            if (difficulty.textReadout) out.append(" ", ...text);
            out.append("\n");
        }

        return out;
    }

    /**
     * 
     * @param {number} char character code
     */
    static colorTag(char) {
        if (char == 0) return "color-white"; // intentionally omitted in css
        if (char == 255) return "color-blue";
        if (char in [37, 13, 5]) return "color-yellow";
        if (char >= 32 && char <= 126) return "color-green";
        return "color-red";
    }
}

/**
 * Get the pair of hex digits representing `char`
 * @param {number} char A byte from 0 to 255
 */
function toHexPair(char) {
    return char.toString(16).padStart(2, "0");
}


main();