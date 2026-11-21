Quietly return 204 No Content for Chromium DevTools well-known requests in development

- Avoids noisy route-miss errors when Chrome or Chromium automatically requests `/.well-known/appspecific/com.chrome.devtools.json` during local development
- Serves static file with 200 OK if `public/.well-known/appspecific/com.chrome.devtools.json` exists
