import { defineConfig } from 'vite';

export default defineConfig({
  // Match the minimum iOS version of the bundled WKWebView application.
  build: { target: 'safari15.4' },
});
