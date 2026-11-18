# Repository guidance

- The interface supports Simplified Chinese (`zh-CN`), English (`en`), Korean (`ko`), and Japanese (`ja`). Keep Simplified Chinese as the default language.
- When adding or changing user-facing interface text, add or update its translation in all four locales in `app.js`. Do not leave new UI text hard-coded in one language.
- Route dynamic notices, puzzle labels, accessibility labels, and print-sheet text through the same translation dictionary.
- User-provided puzzle words and clues are content, so preserve them as entered instead of translating them automatically.
- Keep locale selection persistent across page reloads, and update the document language when the locale changes.

## Pull request conventions

- Write pull request titles and descriptions in English, regardless of the interface language.
- Use a concise, action-oriented title that states the change.
- Structure the description with `## Summary` and `## Testing` sections. Summarize the user-visible behavior and key implementation in bullets.
- List the exact checks run and their outcomes under `## Testing`. If checks were not run, say so; do not imply unverified results.
- Target the repository's default branch unless the user or task specifies another base branch.
- Use the `codex/` prefix for task branches created by Codex, and create or publish a pull request only when requested.
