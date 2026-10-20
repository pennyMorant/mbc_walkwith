import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

import { createVuetify } from "vuetify";

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "walkWithLight",
    themes: {
      walkWithLight: {
        dark: false,
        colors: {
          background: "#f8faf8",
          surface: "#ffffff",
          "surface-variant": "#edf1ea",
          "on-surface": "#191c1a",
          primary: "#386a20",
          "primary-container": "#b8f397",
          secondary: "#56624c",
          "secondary-container": "#dae7ca",
          info: "#32658f",
          warning: "#9a6700",
          success: "#2f6b2f",
          error: "#ba1a1a"
        }
      }
    }
  },
  defaults: {
    VCard: {
      elevation: 0
    },
    VBtn: {
      elevation: 0
    }
  }
});
