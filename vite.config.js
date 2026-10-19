import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets work under /flit-flat/ on Pages and in the iOS bundle.
  base: './',
  // Match the minimum iOS version of the bundled WKWebView application.
  build: { target: 'safari15.4' },
});
