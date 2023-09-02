import json
from flask import Flask, jsonify, make_response, request, send_file
from threading import Thread
from dataclasses_json import dataclass_json
from io import BytesIO
from PIL import Image
from library import get_help
import my_constants as constants
from pathlib import Path
import importlib

app = Flask(__name__)

@app.route('/')
def index():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    return sendResponse(jsonify({"a":"b"}))

@app.route('/endpoints/config', methods=['GET', 'POST', 'OPTIONS'])
def config():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "POST":
        newConfig = request.json
        # TODO SAVE THE NEW CONFIG. COMPARE AND RELOAD REQUIRED PLUGINS
        print("Testing. NewConfig received")
        print(newConfig)
        return sendResponse(jsonify(newConfig))

    config = {'main':{}, 'plugins':{}}
    return sendResponse(jsonify(config))
    

@app.route('/endpoints/plugins/list')
def plugins():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    plugins = get_help._get_modules(root=Path(constants.BASE_DIRECTORY)/'plugins')
    result = {'loaded':[], 'error': []}
    for pluginName in plugins:
        print("Loading: " + pluginName)
        try:
            imported = importlib.import_module(pluginName)
            result['loaded'].append({'name': pluginName, 'version': imported.constants.version})
        except:
            result['error'].append({'name': pluginName})
    return sendResponse(jsonify(result))

@app.route('/endpoints/plugins/<plugin>/layouts')
def pluginLayouts(plugin):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    print(plugin)
    imported = importlib.import_module(plugin)
    layouts = get_help._get_layouts(imported, arrayMode=True)
    return sendResponse(jsonify(layouts))

def startServer():
    t = Thread(target=runServer)
    t.daemon = True
    t.start()

def runServer():
    app.run(host='0.0.0.0', port=4000)
    
def sendResponse(response):
    return _corsify_actual_response(response)

def serveImage(pil_img):
    img_io = BytesIO()
    pil_img.save(img_io, 'PNG')
    img_io.seek(0)
    return _corsify_actual_response(make_response(send_file(img_io, mimetype='image/png')))

def _build_cors_preflight_response(response = None):
    if response is None:
        response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    return response

def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response