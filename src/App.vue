<template>
  <router-view />
</template>

<style>
/* ─── Light theme ───────────────────────────────────────────────────────────── */
:root,
[data-theme="light"] {
  /* Your existing variables */
  --background-color: #fefefe;
  --text-color:       #222;
  --shadow-color:     #999;
  --highlight:        #cdcdcd;
  --highlight-color:  #000;
  --primary:          hsl(206, 70%, 50%);

  /* POI detail variables */
  --font-display: "SF Pro Rounded", ui-rounded, "Helvetica Neue", Arial, sans-serif;
  --font-body:    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  --color-bg:              #fefefe;
  --color-surface:         #ffffff;
  --color-surface-alt:     #f0ede8;
  --color-border:          #e4dfd8;
  --color-accent:          hsl(206, 70%, 50%); /* matches your --primary */
  --color-text:            #222;
  --color-text-secondary:  #4a4440;
  --color-text-muted:      #8a8480;
}

/* ─── Dark theme ────────────────────────────────────────────────────────────── */
[data-theme="dark"] {
  /* Your existing variables */
  --background-color: #323232;
  --text-color:       #ccc;
  --shadow-color:     #111;
  --highlight:        #666;
  --highlight-color:  #eee;
  --primary:          hsl(206, 70%, 40%);

  /* POI detail variables */
  --color-bg:              #323232;
  --color-surface:         #3a3a3a;
  --color-surface-alt:     #2a2a2a;
  --color-border:          #4a4a4a;
  --color-accent:          hsl(206, 70%, 55%); /* slightly lighter for dark bg */
  --color-text:            #ccc;
  --color-text-secondary:  #aaa;
  --color-text-muted:      #777;
}

/* ─── System preference fallback (before JS runs) ───────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --background-color: #323232;
    --text-color:       #ccc;
    --shadow-color:     #111;
    --highlight:        #666;
    --highlight-color:  #eee;
    --primary:          hsl(206, 70%, 40%);

    --color-bg:              #323232;
    --color-surface:         #3a3a3a;
    --color-surface-alt:     #2a2a2a;
    --color-border:          #4a4a4a;
    --color-accent:          hsl(206, 70%, 55%);
    --color-text:            #ccc;
    --color-text-secondary:  #aaa;
    --color-text-muted:      #777;
  }
}

/* ─── Smooth theme transitions ──────────────────────────────────────────────── */
*,
*::before,
*::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
img, iframe, video {
  transition: none;
}

/* ─── Shared card style (used by POI components) ────────────────────────────── */
.card {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

/* ─── Your existing global styles (unchanged) ───────────────────────────────── */
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  background-color: var(--background-color);
  color: var(--text-color);
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center removed — each component handles its own alignment */
  color: #2c3e50;
}

nav {
  padding: 30px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
