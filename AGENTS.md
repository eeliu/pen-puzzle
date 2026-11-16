# Repository guidance

- The interface supports Simplified Chinese (`zh-CN`), English (`en`), Korean (`ko`), and Japanese (`ja`). Keep Simplified Chinese as the default language.
- When adding or changing user-facing interface text, add or update its translation in all four locales in `app.js`. Do not leave new UI text hard-coded in one language.
- Route dynamic notices, puzzle labels, accessibility labels, and print-sheet text through the same translation dictionary.
- User-provided puzzle words and clues are content, so preserve them as entered instead of translating them automatically.
- Keep locale selection persistent across page reloads, and update the document language when the locale changes.
