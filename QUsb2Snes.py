import websocket
import json

# This is a test suite I used while debugging or testing with QUsb2Snes.
# Essentially it made it easier to pop into the python repl and do this
# instead of having to write out the whole json every time.

ws = websocket.WebSocket()

def conn():
    ws.connect("ws://localhost:8080")
    ws.send('{"Opcode": "Attach", "Space": "SNES", "Operands": ["Emu - Derpy Hooves"]}')

def command(opcode, operands = ""):
    return json.dumps({
        "Opcode": opcode,
        "Space": "SNES",
        "Operands": operands
    })

def read(address, size):
    ws.send(command("GetAddress", [address, size]))
    return ws.recv()
    
# Format data as [0xab, 0xbc, 0xde] etc.
def write(address, size, data):
    ws.send(command("PutAddress", [address, size]))
    ws.send_binary(data)
    
def send(opcode, operands="", recv = False):
    ws.send(command(opcode, operands))
    if (recv):
        return ws.recv()