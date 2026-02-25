export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      apiBase: "http://localhost:3001",
    },
  },
});
