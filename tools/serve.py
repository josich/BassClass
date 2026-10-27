"""Local dev server for the BassClass web app (correct MIME types, no caching).

Usage: python tools/serve.py [port]   -> serves ./web on http://localhost:8765

To regenerate docs/CATALOGUE.md, open the app on localhost and run in the console:
    (await import('./js/selftest.js')).saveCatalogue()
"""
import http.server
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.png': 'image/png',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_PUT(self):
        """Dev helper (localhost only): the app can regenerate docs/CATALOGUE.md, the
        processed bass samples under web/audio/bass/, the drum kit under web/audio/drums/
        (web/js/dev/drumprep.js) and the PNG icons (web/js/dev/iconprep.js).
        Paths are strictly whitelisted."""
        if self.client_address[0] not in ('127.0.0.1', '::1'):
            self.send_error(403)
            return
        if self.path == '/__docs/CATALOGUE.md':
            out = os.path.join(ROOT, '..', 'docs', 'CATALOGUE.md')
        elif re.fullmatch(r'/__write/audio/bass/(?:(?:reg|ghost)/\d{2}\.wav|manifest\.json|LICENSE\.txt)', self.path):
            out = os.path.join(ROOT, *self.path[len('/__write/'):].split('/'))
        elif re.fullmatch(r'/__write/audio/drums/(?:[a-z0-9]+(?:-[a-z0-9]+)*\.ogg|kit\.json|LICENSE\.txt)', self.path):
            out = os.path.join(ROOT, *self.path[len('/__write/'):].split('/'))
        elif re.fullmatch(r'/__write/audio/piano/(?:\d{2,3}\.ogg|piano\.json|LICENSE\.txt)', self.path):
            out = os.path.join(ROOT, *self.path[len('/__write/'):].split('/'))
        elif re.fullmatch(r'/__write/_raw/audition/[a-z0-9]+(?:-[a-z0-9]+)*\.wav', self.path):
            # listening clips of candidate drum kits (web/js/dev/drumaudition.js; web/_raw is not committed)
            out = os.path.join(ROOT, *self.path[len('/__write/'):].split('/'))
        elif re.fullmatch(r'/__write/icons/(?:icon-(?:192|512|maskable-512)|apple-touch-icon)\.png', self.path):
            out = os.path.join(ROOT, *self.path[len('/__write/'):].split('/'))
        elif re.fullmatch(r'/__write/android/mipmap-(?:mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi)/ic_launcher(?:_foreground|_background|_monochrome)?\.png', self.path):
            out = os.path.join(ROOT, '..', 'android', 'app', 'src', 'main', 'res', *self.path[len('/__write/android/'):].split('/'))
        else:
            self.send_error(403)
            return
        length = int(self.headers.get('Content-Length', 0))
        if length > 4_000_000:
            self.send_error(413)
            return
        data = self.rfile.read(length)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'wb') as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()


if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler) as httpd:
        print(f'BassClass on http://localhost:{PORT}')
        httpd.serve_forever()
