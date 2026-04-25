// Create a shared stylesheet for Material Symbols styling.
// Note: The font itself must be loaded via a <link> tag in the index.html
// because @import is often restricted in constructable stylesheets.
export const iconStyles = new CSSStyleSheet();

iconStyles.replaceSync(`
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'liga';
}
`);

export const buttonStyles = {
  outline: "btn-outline",
  filled: "btn-filled",
};
