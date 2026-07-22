import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.app import app, socketio

if __name__ == "__main__":
    import eventlet
    import eventlet.wsgi
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)