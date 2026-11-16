# Arithmetic and Word Puzzle Web App — Development Plan

## 1. Goal and scope

Build an open-source, browser-only web app deployed on GitHub Pages. Users can generate random arithmetic crosswords and word crosswords, solve them online, check answers, and print worksheets on A4 paper.

The first release covers both modes. Complete the arithmetic workflow before integrating word puzzles. Accounts, leaderboards, AI-generated clues, and a dedicated PDF engine are outside the initial scope.

## 2. Default rules

| Setting | Initial behavior |
| --- | --- |
| Arithmetic expression | Horizontal or vertical `a operator b = c` |
| Operators | Select any combination of addition, subtraction, multiplication, and division |
| Range | Every operand and result is in `0..N`; presets: 10, 20, 50, 100; allow custom N |
| Subtraction | Nonnegative results |
| Division | Exact integer division; divisor cannot be zero |
| Blanks | Hide numeric cells only; preserve operators and equals signs |
| Shape | Connected, irregular, randomly generated, bounded by the A4 layout |
| Answers | Submit and check online; reveal answers; print an answer sheet separately |

For example, multiplication within 10 permits `2 × 4 = 8` but excludes `3 × 4 = 12`.

Randomness must respect validity, solvability, readability, and page boundaries. Blank count influences difficulty but does not fully describe reasoning difficulty.

## 3. Arithmetic generation

Pipeline:

```text
Settings + seed
    → legal expression candidates
    → randomized intersecting layout
    → remove numbers according to difficulty
    → validate uniqueness and page fit
    → render for solving or printing
```

### 3.1 Legal expressions

Generate valid tuples `(a, operator, b, c)` from the selected range and operators. Exclude division by zero, fractional division results, and values outside the range. Limit repetitive trivial expressions such as `x + 0 = x` and `0 × x = 0`.

### 3.2 Random shape

Start with one expression and attach horizontal or vertical expressions at matching numeric cells.

- Only numeric cells intersect in the initial implementation.
- Shared cells must contain the same value.
- Reject collisions and unintended adjacent expression fragments.
- Keep every expression connected to the puzzle.
- Reject placements outside the page-derived grid bounds.
- Use randomized candidate order, backtracking, and multiple scored attempts.
- Score intersection count, shape variety, page utilization, and repetition.

### 3.3 Blanks and difficulty

| Difficulty | Initial blank ratio | Reasoning target |
| --- | --- | --- |
| Easy | 25% | Mostly direct deductions from individual expressions |
| Normal | 40% | Combine deductions across intersections |
| Hard | 55% | Fewer immediate clues and more dependencies |
| Custom | User-selected blank count | Report the count actually achieved |

Ratios are initial design values to calibrate against generated samples. Remove clues incrementally and preserve a unique solution. An arbitrary requested blank count may be impossible; report this clearly instead of silently producing ambiguity.

### 3.4 Solver and uniqueness

Treat blank cells as variables and expressions as constraints:

1. Filter expression candidates against visible numbers.
2. Propagate possible values across shared cells.
3. If unresolved, branch on the variable with the fewest candidates.
4. Stop once a second solution is found.

Accept only puzzles with exactly one solution. Apply attempt and time budgets, and execute expensive generation and solving in a Web Worker. Define an explicit retry/failure response when constraints cannot be satisfied within the budget.

## 4. Word generation

Reuse grid coordinates, rendering, printing, and input infrastructure, but use a separate word generator.

Input consists of words and clues, for example:

```text
APPLE   苹果
BOOK    书
HOUSE   房子
```

Generation steps:

1. Validate entries, normalize letter case, and remove duplicates.
2. Prioritize longer words or words with more intersection opportunities.
3. Find placements at matching letters.
4. Check boundaries, intersections, and spacing between unrelated words.
5. Try multiple randomized layouts and select a connected layout fitting the page.
6. Number starting cells and generate Across/Down clue lists.

Not every word list can form a connected crossword. For example, `CAT` and `DOG` share no letters. Display placed and unplaced words explicitly; allow regeneration or list editing.

Initial features:

- Small built-in themed word lists.
- Paste custom words and Chinese clues.
- Difficulty controlled by the proportion of prefilled letters.
- Optional visible word bank for beginners.

Vocabulary difficulty depends on the selected list. Clue ambiguity is distinct from arithmetic uniqueness and must not receive the same uniqueness guarantee.

## 5. Data model and rendering

Recommended stack: TypeScript, React, and Vite; all runtime processing stays in the browser.

| Layer | Responsibility |
| --- | --- |
| SVG | Cell borders, numbers, letters, operators, clue numbers, and answer rendering |
| HTML input overlay | Editing, focus, keyboard navigation, and mobile input |
| HTML/CSS | Settings, clue lists, responsive layout, and printable page structure |

Use a single puzzle model containing coordinates, cell types, visible values, solution values, user entries, expression/word relationships, settings, random seed, and generator version. Online view, worksheet, and answer sheet must read the same model.

Avoid a full Canvas renderer initially because text input requires additional work and print clarity is easier to preserve with SVG.

## 6. A4 layout and printing

- A4 portrait: 210 × 297 mm.
- Initial page margins: 12 mm on every side.
- Available content area: 186 × 273 mm.
- Reserve space for title, settings summary, footer, and word clues before sizing the grid.

```text
cell size = min(available width / columns, available height / rows)
```

Start with a minimum cell size of 8 mm and validate readability. If the puzzle cannot fit at the minimum size, reduce puzzle size or regenerate rather than shrinking indefinitely. Word clue space must be included in the page budget.

Print CSS foundation:

```css
@page {
  size: A4 portrait;
  margin: 12mm;
}

@media print {
  .controls {
    display: none;
  }

  .worksheet {
    break-inside: avoid;
  }
}
```

Provide separate actions:

- Print puzzle: one A4 worksheet without answers.
- Print answers: a separate answer sheet.
- Print puzzle and answers: two explicitly separated pages.

Browser paper, scaling, and header/footer settings can affect physical output. Validate generated print PDFs for page count and clipping; CSS alone does not control every print-dialog setting.

## 7. Online workflow and persistence

```text
Choose mode → configure → generate → fill cells → submit/check → reveal answers
                              └→ print worksheet
```

- Arrow-key navigation and Tab navigation between blanks.
- Mark incorrect entries on submission and allow corrections.
- Reveal full answers and reset entries.
- Save current puzzle and progress locally.
- Display a puzzle identifier and support deterministic regeneration.
- Same settings, seed, and generator version reproduce the same puzzle.
- New random generation uses a new seed.

Sharing custom-word puzzles eventually requires the complete puzzle or word-list data through encoding or import/export; a seed alone is insufficient.

Answers are present in the browser. This release targets practice, not secure examinations.

## 8. Implementation milestones

| Stage | Deliverables | Acceptance criteria |
| --- | --- | --- |
| 1. Core model and algorithms | Grid model, seeded randomness, arithmetic candidates, layout generator, solver | Valid arithmetic, bounds, connectivity, and unique solutions |
| 2. Arithmetic workflow | Settings, operators, difficulty, random shapes, entry, checking, answers | Selected settings are respected; achieved blank count is explicit |
| 3. A4 rendering | SVG grid, preview, print stylesheet, answer pagination | One worksheet page, no clipping, readable cells |
| 4. Word mode | Built-in/custom lists, crossword layout, clues, entry and checking | Correct intersections; explicit unplaced-word feedback |
| 5. Open-source delivery | English README, algorithm documentation, license, CI, Pages workflow | Reproducible build and correct repository-subpath deployment |

License selection remains to be finalized before publication. Repository creation, remote publishing, and deployment configuration require the destination repository to be established.

## 9. Validation

- Batch seeded algorithm tests across ranges, operators, and difficulty settings.
- Independently verify expression correctness, solution uniqueness, connectivity, and grid bounds.
- Verify reproducibility using settings, seed, and generator version.
- Cover generation budgets and impossible or restrictive inputs.
- End-to-end checks for generating, entering answers, checking, and revealing.
- Print-to-PDF checks for A4 size, expected page count, and clipping.
- Desktop, mobile, and print preview screenshots for visual review.
- Build and verify GitHub Pages repository-subpath asset loading.

## 10. References

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [MDN: CSS page size](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40page/size)
- [MDN: Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing)

This document records the proposed design; implementation has not started.
