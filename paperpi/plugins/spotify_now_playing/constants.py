version = '0.1.1'
name = 'basic clock'

config_keys = {
}

data = { 'digit_time': '00:00' }

json_config = {
  "layout": "layout",
  "plugin": "spotify_now_playing",
  "refresh_rate": 100,
  "min_display_time": 50,
  "max_priority": 2,
  "start_server": {
    "description": "Start the server to make the login on Spotify account",
    "value": True,
    "type": "bool"
  },
  "server_port": {
    "description": "Port that will be used to start the server",
    "value": 4444,
    "type": "int"
  },
  "client_id": {
    "description": "Client ID from Spotify Developer dashboard",
    "value": "",
    "type": "string"
  },
  "client_secret": {
    "description": "Client Secret from Spotify Developer dashboard",
    "value": "",
    "type": "string"
  },
  "refresh_token": {
    "description": "You can get this value once you make the login",
    "value": "",
    "type": "string"
  }
}

sample_config = '''
[Plugin: Spotify Now Playing]
layout = layout
plugin = spotify_now_playing
refresh_rate = 3
min_display_time = 60
max_priority = 2**15
start_server = True
server_port = 8888
client_id = 
client_secret = 
refresh_token = 

'''
