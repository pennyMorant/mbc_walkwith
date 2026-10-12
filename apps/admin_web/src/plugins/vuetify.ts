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
          primary: "#386a20",
          "primary-container": "#b8f397",
          secondary: "#56624c",
          "secondary-container": "#dae7ca",
          error: "#ba1a1a"
        }
      }
    }
  },
  defaults: {
    VCard: {
      rounded: "lg",
      elevation: 0
    },
    VBtn: {
      rounded: "lg"
    }
  }
});
