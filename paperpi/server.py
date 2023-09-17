import json
from flask import Flask, jsonify, make_response, request, send_file, render_template
from threading import Thread
from io import BytesIO
from library import get_help
import my_constants as constants
from pathlib import Path
import importlib
import copy
import logging
from library.CacheFiles import CacheFiles
import traceback

from epdlib import Screen

from configuration import configure_plugin
from library.Plugin import Plugin

app = Flask(__name__, static_url_path="", static_folder="web_static", template_folder="web_static")


logger = logging.getLogger(__name__)
config = None

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/endpoints/config', methods=['GET', 'POST', 'OPTIONS'])
def config():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "POST":
        newConfig = request.json
        # TODO SAVE THE NEW CONFIG. COMPARE AND RELOAD REQUIRED PLUGINS
        with open(constants.CONFIG_USER, "w") as config_file:
            config_file.write(json.dumps(newConfig))
        print("Testing. NewConfig received")
        print(newConfig)
        return sendResponse(jsonify(newConfig))

    with open(constants.CONFIG_USER) as config_file:
        file_contents = config_file.read()
    loaded_config = json.loads(file_contents)
    # Send only values
    for key in loaded_config['main']:
        if type(loaded_config['main'][key]) is dict:
            loaded_config['main'][key] = loaded_config['main'][key]['value']
    return sendResponse(jsonify(loaded_config))


@app.route('/endpoints/plugins/test', methods=['POST', 'OPTIONS'])
def testPlugin():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    try:
        config = request.json
        image = setupPlugin(config)
    except:
        traceback.print_exc()
    return serveImage(image)


@app.route('/endpoints/plugins/<plugin>/sample_image')
def getSampleImage(plugin):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    file = constants.BASE_DIRECTORY + '/plugins/' + plugin + "/" + plugin + ".layout-L-sample.png"
    print(file)
    return send_file(file)


@app.route('/endpoints/plugins/list')
def plugins():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    plugins = get_help._get_modules(root=Path(constants.BASE_DIRECTORY) / 'plugins')
    result = {'loaded': [], 'error': []}
    for pluginName in plugins:
        print("Loading: " + pluginName)
        try:
            imported = importlib.import_module(pluginName)
            if pluginName == 'default':
                json = imported.constants.json_config
                print(json)
            if 'configurable' not in imported.constants.json_config or imported.constants.json_config['configurable']:
                result['loaded'].append({'name': pluginName, 'version': imported.constants.version})
        except:
            result['error'].append({'name': pluginName})
    return sendResponse(jsonify(result))


@app.route('/endpoints/config/main/info')
def mainConfigInfo():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    file = open(constants.BASE_DIRECTORY + '/config/paperpi_cfg.json')
    data = json.load(file)
    file.close()
    # Load screen types
    try:
        screens = Screen().list_compatible()
        screen_names = []
        for screen in screens:
            screen_names.append(screen.name)
        data['main']['display_type']['choice'] = screen_names
    except:
        # If we are not on Raspberry Pi show fake display list
        data['main']['display_type']['choice'] = ['pygame']
    return sendResponse(jsonify(data))


@app.route('/endpoints/plugins/<plugin>/info')
def pluginConfigInfo(plugin):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    imported = importlib.import_module(plugin)
    config = copy.deepcopy(imported.constants.json_config)
    layouts = get_help._get_layouts(imported, array_mode=True)

    # Add default system keys
    for key in constants.REQ_PLUGIN_KEYS:
        config[key] = constants.REQ_PLUGIN_KEYS[key]
        config[key]['system_required'] = True

    for key in config:
        if key == 'layout':
            # Set layouts on config
            config[key]['choice'] = layouts

        if key == 'plugin':
            config[key]['value'] = plugin

        # Check if type is a simple string
        if isinstance(config[key], str):
            config[key] = {"description": "", 'value': config[key], 'type': 'string'}
        # Check type is defined. By default we asumme is a string
        elif not 'type' in config[key]:
            config[key]['type'] = 'string'

    # Set enabled
    config['enabled'] = {"description": "If false. This plugin will not be used", 'type': 'bool', 'value': True,
                         'system_required': True}
    response = {'version': imported.constants.version, 'config': config}

    return sendResponse(jsonify(response))


def startServer(loadedConfig):
    global config
    config = loadedConfig
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


def _build_cors_preflight_response(response=None):
    if response is None:
        response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    return response


def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

def setupPlugin(values):
    global config
    cache = CacheFiles(path_prefix=constants.APP_NAME)
    config['main']['plugin_timeout'] = 0
    plugin = configure_plugin(config['main'], values, (800, 400), cache)
    return plugin.image