from flask import Flask, Response
from flask_socketio import SocketIO
from werkzeug import serving
from SuperMetroid import super_metroid
from ZeroMission import zero_mission
import Settings

app = Flask(__name__)
app.config['SECRET_KEY'] = 'my_secret_key'
app.register_blueprint(super_metroid)
app.register_blueprint(zero_mission)
socketio = SocketIO(app, logger=True, cors_allowed_origins="*")

@app.route('/settings', methods = ['GET', 'OPTIONS'])
def settings():
    resp = Response(Settings.to_json())
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Headers'] = 'content-type'
    return resp



@socketio.on('connect')
def test_connect():
    print('Connected')
    
@socketio.on('disconnect')
def disconnect():
    print("Client disconnected.")
    
@socketio.on('message')
def handle_message(message):
    print("Received message " + str(message))

# https://stackoverflow.com/questions/56959585/skip-flask-logging-for-one-endpoint    
def disable_endpoint_logs():
    disabled_endpoints = ['/mzm/status', '/sm/status']
    
    parent_log_request = serving.WSGIRequestHandler.log_request
    
    def log_request(self, *args, **kwargs):
        if self.path not in disabled_endpoints:
            parent_log_request(self, *args, **kwargs)
    
    serving.WSGIRequestHandler.log_request = log_request

if __name__ == "__main__":
    disable_endpoint_logs()
    socketio.run(app)