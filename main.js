//@ts-check

const nameHeading = document.getElementById("nameHeading");

/**
 * @type ("easy" | "medium" | "hard")
 */
let difficulty = "medium";
{
    const search = new URLSearchParams(window.location.search);
    const searchDifficulty = search.get("difficulty");
    switch (searchDifficulty) {
        case "easy":
            difficulty = "easy";
            nameHeading?.append(" (Easy)");
            break;
        case "hard":
            difficulty = "hard";
            nameHeading?.append(" (Hard)");
            break;
    }
}
console.info("Difficulty: ", difficulty);

const hexDisplayWidth = 16;

function main() {
    const numChars = (() => {
        switch (difficulty) {
            case "easy": return 1;
            case "medium": return 4;
            case "hard": return 5 + Math.floor(Math.random() * 3);
        }
    })();

    if (difficulty == "hard") {
        document.body.classList.remove("highlight");
    }

    const corpus = corpusElement.textContent.split("\n\n").filter(x => x.length > 256);
    console.info("Corpus size: ", corpus.length);

    const puzzleIndex = Math.floor(Math.random() * corpus.length);
    const puzzleKey = new Uint8Array(numChars);
    for (let i = 0; i < numChars; i++) {
        puzzleKey[i] = Math.floor(Math.random() * 256);
    }

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

/**
 * @type HTMLDetailsElement
 */
// @ts-ignore
const guessLog = document.getElementById("guessLog");

function getPuzzleInput() {
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

    return new Uint8Array(out);
}

puzzleInput.addEventListener("input", () => {
    puzzleInput.setCustomValidity("");
    if (!getPuzzleInput()) {
        puzzleInput.setCustomValidity("Enter a valid hex!");
    }
});

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

            out.append(rowIndex, ': ', ...hex, " ", ...text, "\n");
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