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

- Seeded eight-direction arithmetic layouts with addition, subtraction, multiplication, and exact division. Equivalent commutative and inverse equations count as one arithmetic fact.
- PP2 IDs retain their compact format. New IDs use generator version 4 with separate seeded equation, layout, and blank-selection streams; older PP1 and PP2 IDs supply their seed and rules to the current generator rather than preserving their original worksheets.
- Custom word lists and clues, intersecting across/down placements, prefilled letters, and explicit feedback for words that could not be placed.
- Responsive browser layout, local progress persistence, and A4 print styles.
- No runtime server or account. Answers are available in the browser, so these puzzles are for practice rather than secure exams.

## Current limits

Puzzle generation is bounded and best-effort. New arithmetic puzzles retain only blank combinations that can be recovered through forced single-unknown equations, guaranteeing a unique solution within the selected integer range. Difficulty blank percentages are targets; uniqueness and keeping a blank in every equation take priority. CI independently counts solutions for a fixed rule matrix and 1,000 reproducible randomized puzzles, stopping at the second solution. Word clues are user-provided and can be ambiguous. Browser print-dialog scaling and headers/footers can affect the physical result.

The repository is licensed under the MIT License.
