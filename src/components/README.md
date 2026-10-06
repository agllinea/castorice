# Shared components

This directory contains UI and data-model code that can be reused by both the local editor and the future web application.

- `content/`: mission and screenplay types, tree operations, rich-text rendering, read-only content, and inline editing.
- `forms/`: small generic form controls used by content editors.

Local filesystem and API behavior stays in `src/editor`; shared components accept data and callbacks instead of calling editor endpoints directly.
