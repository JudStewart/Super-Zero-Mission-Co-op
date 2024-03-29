from flask import Flask, Response, request
from flask_socketio import SocketIO
from werkzeug import serving
from SuperMetroid import super_metroid
from ZeroMission import zero_mission
import Settings
import Saves
import sys
import getopt
import json

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

@app.route('/save')
def save_route():
    resp = Response(Saves.save_json())
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Headers'] = "content-type"
    return resp

@app.route('/load', methods=['POST'])
def load_route():
    Saves.load(request.body)
    resp = Response("Loading...")
    resp.headers['Access-Control-Allow-Origin'] = "*"
    resp.headers['Access-Control-Allow-Headers'] = "content-type"
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

# https://stackoverflow.com/questions/56959585/skip-flask-logging-for-one-endpoint - Thank you!
def disable_endpoint_logs():
    disabled_endpoints = ['/mzm/status', '/sm/status']
    
    parent_log_request = serving.WSGIRequestHandler.log_request
    
    def log_request(self, *args, **kwargs):
        if self.path not in disabled_endpoints:
            parent_log_request(self, *args, **kwargs)
    
    serving.WSGIRequestHandler.log_request = log_request

if __name__ == "__main__":

    args, _ = getopt.getopt(sys.argv[1:], "l:s:c:h", ["load =", "save =", "config =", "help"])

    for opt, arg in args:
        if opt in ["-l", "--load"]:
            Saves.load(arg)
        if opt in ['-s', '--save']:
            Saves.save_file_path = arg
        if opt in ['-c', '--config', '--settings']:
            settings_file = open(arg)
            Settings.settings = json.load(settings_file)
            settings_file.close()
            print("The following settings have been loaded: ")
            print(json.dumps(Settings.settings, indent=4, sort_keys=True))
        if opt in ['-h', '--help']:
            print("Options:")
            print("\t-s / --save [file name]: specifies the file to save to.")
            print("\t-l / --load [file name]: loads a save from the provided file.")
            print("\t-c / --config [file name]: sets the settings of the run according to the provided json file.")
            print("\t-h / --help: Show this list.")
            exit()

    disable_endpoint_logs()
    socketio.run(app, host='0.0.0.0', port=5000)