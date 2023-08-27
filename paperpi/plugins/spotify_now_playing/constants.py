version = '0.1.1'
name = 'basic clock'

config_keys = {
}

data = { 'digit_time': '00:00' }

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
