"""QA helper: serve a directory read-only with CORS (so a page on another port can import an older
snapshot of the app's modules side by side). Usage: python qa/tools/cors_serve.py <dir> <port>"""
import http.server
import sys

DIR, PORT = sys.argv[1], int(sys.argv[2])


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.json': 'application/json'}

    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIR, **k)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
