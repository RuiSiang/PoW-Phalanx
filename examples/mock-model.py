# Prerequisites: python-socketio, websocket-client
import socketio

socket = socketio.Client()
socket.connect('http://localhost:6000?token=test-model-token')


@socket.event
def connect():
    print("Connection Succeeded")


@socket.event
def connect_error(data):
    print("Connection Error")


@socket.event
def disconnect():
    print("Connection Terminated")


@socket.event
def message(data):
    # do something with received data
    print(data)


# test emit
socket.emit('message', {'method': 'fetch_batch_stats', 'arguments': []})
