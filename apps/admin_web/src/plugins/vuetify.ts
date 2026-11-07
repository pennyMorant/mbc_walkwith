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
          background: "#f5f7f4",
          surface: "#ffffff",
          "surface-bright": "#ffffff",
          "surface-light": "#eef2ec",
          "surface-variant": "#e1e6dd",
          "on-surface": "#191c1a",
          "on-surface-variant": "#43483f",
          outline: "#74796f",
          "outline-variant": "#c4c8be",
          primary: "#386a20",
          "on-primary": "#ffffff",
          "primary-container": "#b8f397",
          "on-primary-container": "#0c3900",
          secondary: "#56624c",
          "secondary-container": "#dae7ca",
          "on-secondary-container": "#151e0e",
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
    },
    VMenu: {
      offset: 8
    }
  }
});
