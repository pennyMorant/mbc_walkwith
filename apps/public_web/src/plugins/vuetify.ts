import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

import { createVuetify } from "vuetify";

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "publicLight",
    themes: {
      publicLight: {
        dark: false,
        colors: {
          background: "#fbfaf6",
          surface: "#ffffff",
          primary: "#315f45",
          "primary-container": "#d9eadf",
          secondary: "#6f5b35",
          "secondary-container": "#f2dfb9",
          tertiary: "#345d73",
          "tertiary-container": "#d9e8ef",
          error: "#ba1a1a"
        }
      }
    }
  },
  defaults: {
    VBtn: {
      rounded: "sm"
    },
    VCard: {
      rounded: "sm",
      elevation: 0
    },
    VChip: {
      rounded: "sm"
    }
  }
});
