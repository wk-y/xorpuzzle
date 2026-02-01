//@ts-check

const difficulty = 3 + Math.floor(Math.random() * 3);

function main() {
    const corpus = corpusElement.textContent.split("\n\n").filter(x => x.length > 100 && x.length < 300);
    const puzzleIndex = Math.floor(Math.random() * corpus.length);
    const puzzleKey = new Uint8Array(difficulty);
    for (let i = 0; i < difficulty; i++) {
        puzzleKey[i] = Math.floor(Math.random() * 256);
    }

    let puzzle = new Puzzle(corpus[puzzleIndex], puzzleKey);

    /**
     * 
     * @param {Uint8Array} enteredKey
     */
    function updateDisplay(enteredKey) {
        puzzleViewer.innerHTML = "";
        puzzleViewer.append(PuzzleHexViewer.html(Puzzle.encode(puzzle.getEncoded(), enteredKey), 16));
    }

    updateDisplay(new Uint8Array([0]));

    puzzleForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const input = getPuzzleInput();
        if (input == null) throw "invalid input";

        updateDisplay(input);
    });
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

        for (let i = 0; i < n;) {
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
                    hexSpan.textContent = char.toString(16).padStart(2, "0") + " ";
                    hexSpan.classList.add(tag);
                    hex.push(hexSpan);
                }

                {
                    const textSpan = document.createElement("span");
                    textSpan.classList.add(tag);
                    textSpan.textContent = tag == "hex-readable" ? String.fromCharCode(char) : ".";
                    text.push(textSpan);
                }
            }

            while (hex.length < bytesPerLine) {
                hex.push("   ");
            }

            out.append(...hex, ...text, "\n");
        }

        return out;
    }

    /**
     * 
     * @param {number} char character code
     */
    static colorTag(char) {
        if (char == 0) return "hex-00";
        if (char == 255) return "hex-ff";
        if (char >= 32 && char <= 128) return "hex-readable";
        return "hex-unreadable";
    }
}

main()