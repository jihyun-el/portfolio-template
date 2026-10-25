import tokens from "../../content/theme.json";
import { createThemeCss, createSignalPaletteGLSL } from "../../scripts/theme.mjs";

// One editable source supplies both the page's CSS colors and the art's shader colors.
export const themeCss = createThemeCss(tokens);
export const signalPaletteGLSL = createSignalPaletteGLSL(tokens);
