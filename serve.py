#!/usr/bin/env python3
import http.server
import os
import posixpath
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def translate_path(self, path):
        # Preserve static file serving normally, but fall back to index.html for the SPA routes.
        normal = super().translate_path(path)
        if os.path.exists(normal):
            return normal

        if path.startswith('/music/') or path in ('/', '/index.html'):
            return str(DIST / 'index.html')

        return normal

    def end_headers(self):
        if self.path.startswith('/music/'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    port = 8000
    httpd = http.server.ThreadingHTTPServer(('0.0.0.0', port), SPAHTTPRequestHandler)
    print(f'Serving at http://localhost:{port}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStopping server...')
    finally:
        httpd.server_close()
