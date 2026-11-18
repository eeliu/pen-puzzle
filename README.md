# Pen & Puzzle

A lightweight, browser-only arithmetic and word crossword worksheet maker. It runs as static files and can be hosted on GitHub Pages without an account, backend, or build step.

## Use it

Open `index.html` in a browser, choose a puzzle type, adjust its settings, and generate a puzzle. The app supports answer checking, revealing solutions, local progress saving, and printing the puzzle and answer sheet separately.

Online page: [https://eeliu.github.io/pen-puzzle/](https://eeliu.github.io/pen-puzzle/)

For local development, serve this directory with any static web server, for example:

```sh
npx serve .
```

## What is included

- Seeded arithmetic equation layouts with addition, subtraction, multiplication, and exact division.
- Custom word lists and clues, intersecting across/down placements, prefilled letters, and explicit feedback for words that could not be placed.
- Responsive browser layout, local progress persistence, and A4 print styles.
- No runtime server or account. Answers are available in the browser, so these puzzles are for practice rather than secure exams.

## Current limits

Puzzle generation is bounded and best-effort. Arithmetic expressions are checked for valid operands/results and exact division, but the current release does not run a constraint solver to prove that each generated puzzle has exactly one solution. Word clues are user-provided and can be ambiguous. Browser print-dialog scaling and headers/footers can affect the physical result.

The repository is licensed under the MIT License.
