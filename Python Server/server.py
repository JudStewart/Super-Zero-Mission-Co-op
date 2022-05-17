from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, send
import websocket
import sys
import json

ws = websocket.WebSocket()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'my_secret_key'
socketio = SocketIO(app, logger=True)



def connect_qusb2snes():
    qusbIP = "ws://localhost:8080"
    if (len(sys.argv) > 1): qusbIP = sys.argv[1]
    try:
        ws.connect(qusbIP)
    except:
        print("Invalid url: " + qusbIP)
        exit()
    ws.send(json.dumps({
        "Opcode": "DeviceList",
        "Space": "SNES"
    }))
    devList = json.loads(ws.recv())["Results"]
    choice = -1
    if (len(devList) == 1): choice = 0
    elif (len(devList) == 0):
        print("Please open QUsb2Snes and launch your preferred method of SNESing")
        exit()
    else:
        for n, opt in enumerate(devList):
            print(str(n) + ". " + opt)
        while choice <= 0 or choice >= len(devList):
            print("Choose a device:")
            try:
                choice = int(input)
            except:
                choice = -1
                print("Please enter a valid number between 0 and " + str(len(devList) - 1))
    device = devList[choice]
    ws.send(json.dumps({
        "Opcode": "Attach",
        "Space": "SNES",
        "Operands": [device]
    }))
    ws.send(json.dumps({
        "Opcode": "Info",
        "Space": "SNES"
    }))
    print(json.loads(ws.recv())["Results"])
    
@app.route('/mzm')
def mzm():
    return {
        "value": "test"
    }
    
@app.route('/mzm/acquired', methods= ['POST'])
def mzm_received_item():
    item = request.form['payload']
    print(f"MZM player acquired item '{item}'")
    return f"Parsing acquired {item}"

@socketio.on('connect')
def test_connect():
    emit('confirmation',  {'result':'Connected'})
    
@socketio.on('disconnect')
def disconnect():
    print("Client disconnected.")
    
@socketio.on('message')
def handle_message(message):
    print("Received message " + str(message))

if __name__ == "__main__":
    # connect_qusb2snes()
    socketio.run(app)