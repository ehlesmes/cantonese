# Design: Advanced LocalStorage Editor

## Objective

Provide a developer-friendly interface to view and manage application state stored in
`localStorage`.

## User Journey

1.  Navigate to `/#/advanced`.
2.  View a list of current `localStorage` keys and values.
3.  For each key, see an editable JSON representation (formatted, collapsible).
4.  Optionally add, rename, or delete keys.
5.  Validate edits against known application schemas before saving.

## UI Components

- **Key List:** Sidebar or top-level list of all keys.
- **Editor:** A code-friendly text area (or tree view) for editing values.
- **Controls:** "Save", "Delete", "Add" buttons per entry.
- **Validation Status:** Inline error indicators if JSON is invalid or fails schema checks.

## Technical Considerations

- **Schema Sharing:** Use a shared module for validation rules to ensure consistency between the
  build-time compliance check and runtime debugging.
- **State Handling:** Editing should update the view state immediately, with "Save" explicitly
  syncing to `localStorage`.
