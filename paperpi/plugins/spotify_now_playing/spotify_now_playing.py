#!/usr/bin/env python3
# coding: utf-8

import logging
import requests
import base64
from flask import Flask, redirect, request, jsonify
from threading import Thread
import urllib.parse
import time
import socket

from . import layout
from . import constants

app = Flask(__name__, static_url_path='', static_folder='web')

logger = logging.getLogger(__name__)

config = None
redirect_uri = None

def runServer(self):
    app.run(port=self.config['server_port'], host="0.0.0.0")

@app.route('/')
def index():
    return redirect("/index.html", code=302)

@app.route('/login')
def login():
    global redirect_uri
    redirect_uri = request.args.get('redirect_uri')
    url = 'https://accounts.spotify.com/authorize?'
    params = {
        'response_type': 'code', 
        'client_id': config['client_id'],
        'scope': 'user-read-playback-state',
        'redirect_uri': redirect_uri
        }
    return redirect(url + urllib.parse.urlencode(params), code=302)

@app.route('/status')
def status():
    global config

    response_code_authorize = 500
    response_error_authorize = "unknown_error"
    playing_data_ok = False
    playing_data = None

    if 'refresh_token' in config and config['refresh_token'] is not None:
        token_response = getToken()
    else:
        token_response = {'error': 'no_token'}

    if token_response['error'] is not None:    
        try:
            url = 'https://accounts.spotify.com/authorize?'
            params = {
                'response_type': 'code', 
                'client_id': config['client_id'],
                'scope': 'user-read-playback-state',
                'redirect_uri': request.args.get('redirect_uri')
            }
            r = requests.get(url=url + urllib.parse.urlencode(params))
            response_code_authorize = r.status_code
            if response_code_authorize == 200:
                response_error_authorize = None
            else:
                response_code_authorize = r.text()

        except:
            pass
    else:
        response_code_authorize = 200
        response_error_authorize = None
        try:
            playing_data = getPlayingTrack(token_response['token'])
            playing_data_ok = True
        except:
            pass

    client_id = None
    if 'client_id' in config:
        client_id = makeSecret(config['client_id'])
    
    client_secret = None
    if 'client_secret' in config:
        client_secret = makeSecret(config['client_secret'])

    refresh_token = None
    if 'refresh_token' in config:
        if 'refresh_token_memory' in config:
            refresh_token = config['refresh_token']
        else:
            refresh_token = makeSecret(config['refresh_token'])
    
    data = {
        'response_code_authorize': response_code_authorize,
        'response_error_authorize': response_error_authorize,
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'token_response_error': token_response['error'],
        'playing_data_response_ok': playing_data_ok,
        'playing_data': playing_data
    }
    return jsonify(data)

def makeSecret(data):
    if data is None:
        return data
    if len(data) < 16:
        return "*" * len(data)
    
    return data[:4] + "*" * (len(data)-6) + data[-4:]

    

@app.route('/callback')
def spotifyRedirect():
    global config
    global redirect_uri

    # Get refresh token from the code
    data = {
        'grant_type': 'authorization_code',
        'code': request.args.get('code'),
        'redirect_uri': redirect_uri
    }
    url = "https://accounts.spotify.com/api/token"
    headers = {'Authorization': "Basic " + base64.b64encode((config['client_id'] + ":" + config['client_secret']).encode('ascii')).decode('ascii'), "Content-Type": 'application/x-www-form-urlencoded'}
    r = requests.post(url, data=data, headers=headers)
    response = r.json()

    config['refresh_token'] = response['refresh_token']
    config['refresh_token_memory'] = True
    return redirect("/index.html?refresh_token=" + config['refresh_token'], code=302)

def start_server(self):
    if self.config['start_server']:
        global config
        config = self.config
        self.config['start_server'] = False
        t = Thread(target=runServer, args=[self])
        t.daemon = True
        t.start()

def getToken():
    global config
    try:
        url = "https://accounts.spotify.com/api/token"
        headers = {'Authorization': "Basic " + base64.b64encode((config['client_id'] + ":" + config['client_secret']).encode('ascii')).decode('ascii'), "Content-Type": 'application/x-www-form-urlencoded'}
        data = 'grant_type=refresh_token&refresh_token=' + config['refresh_token']
        r = requests.post(url, data=data, headers=headers)
        response = r.json()
        if 'error' in response:
            return {'error': response['error'] +  " - " + response['error_description'], 'token': None}
        data = {
            'token': response['access_token'],
            'expire_time': time.time() + response['expires_in'],
            'error': None
        }
        return data
    except:
        return {'error': 'unknown_error', 'token': None}
    
def getPlayingTrack(token):
    url = "https://api.spotify.com/v1/me/player"
    headers = {'Authorization': "Bearer " + token}
    r = requests.get(url=url, headers=headers)
    if (r.status_code == 204):
        # Nothing playing
        return None
    elif r.status_code == 200:
        return r.json()


from datetime import datetime
def update_function(self):
    start_server(self)
    '''provides system time string in the format HH:MM
    
    Args:
        None
    

    Returns:
        tuple: (is_updated(bool), data(dict), priority(int))
    %U'''

    image = None
    title = ""
    artist = ""
    album = ""
    error = True

    # Check if we must update token 
    if not hasattr(self, 'tokenData') or self.tokenData['token'] is None or self.tokenData['expire_time'] - 120 < time.time():
        self.tokenData = getToken()

    if self.tokenData['error'] is not None or self.tokenData['token'] is None:
        priority = self.max_priority
        is_updated = True
        title = "Plugin not configured"

        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        title += " go to http://" + ip + ":" + str(self.config['server_port'])

        data = {'title': title, 'artist': artist, 'album': album, 'coverart': image}
        return (is_updated, data, priority) 
    
    try:
        data = getPlayingTrack(self.tokenData['token'])
        error = False
        if data is not None:
            imageUrl = data['item']['album']['images'][0]['url']
            title = data['item']['name']
            album = data['item']['album']['name']
            artist = data['item']['album']['artists'][0]['name']
            text = data['item']['name'] + " - " + data['item']['album']['artists'][0]['name']
            image = self.cache.cache_file(imageUrl, "spotify_album_image_id_" + data['item']['album']['id'])
    
    except:
        pass

    data = {'title': title, 'artist': artist, 'album': album, 'coverart': image}
    priority = self.max_priority
    is_updated = True
    
    return (is_updated, data, priority) 
