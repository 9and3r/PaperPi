import json
from flask import Flask, jsonify, make_response, request, send_file, render_template
from threading import Thread
from dataclasses_json import dataclass_json
from io import BytesIO
from PIL import Image
from library import get_help
import my_constants as constants
from pathlib import Path
import importlib
import copy
import logging
from library.CacheFiles import CacheFiles
from importlib import import_module
import traceback


from library.Plugin import Plugin

app = Flask(__name__, static_url_path="", static_folder="web", template_folder="web")

logger = logging.getLogger(__name__)

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
        print("Testing. NewConfig received")
        print(newConfig)
        return sendResponse(jsonify(newConfig))

    config = {'main':{}, 'plugins':{}}
    return sendResponse(jsonify(config))

@app.route('/endpoints/plugins/<plugin>/test', methods=['POST', 'OPTIONS'])
def testPlugin(plugin):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    print("Loading pluing: " + plugin)
    try:
        image = setupPlugin(plugin, request.json)
    except:
        traceback.print_exc()
    print(type(image))
    return serveImage(image)

@app.route('/endpoints/plugins/<plugin>/sample_image')
def getSampleImage(plugin):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    file = constants.BASE_DIRECTORY + '/plugins/' + plugin + "/" + plugin +".layout-L-sample.png"
    print(file)
    return send_file(file)
    

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

@app.route('/endpoints/plugins/<plugin>/info')
def pluginLayouts(plugin):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    imported = importlib.import_module(plugin)
    config = copy.deepcopy(imported.constants.json_config)
    layouts = get_help._get_layouts(imported, arrayMode=True)
    print(config)
    for key in config:
        if key == 'layout':
            # Set layouts on config
            config[key] = {"description": "", 'value': config[key], 'choice': layouts, 'system_required': True}
        elif key == 'plugin':
            config[key] = {"description": "Plugin to use", 'value': config[key], 'type': 'string', 'system_required': True}
        elif key == 'refresh_rate':
            config[key] = {"description": "Max refresh time in seconds", 'value': config[key], 'type': 'int', 'system_required': True}
        elif key == 'min_display_time':
            config[key] = {"description": "Min time that the plugin should be displayed in seconds", 'value': config[key], 'type': 'int', 'system_required': True}
        elif key == 'max_priority':
            config[key] = {"description": "Max priority of the plugin", 'value': config[key], 'type': 'int', 'system_required': True}
        else:
            # Check if type is a simple string
            if isinstance(config[key], str):
                config[key] = {"description": "", 'value': config[key], 'type': 'string'}
            # Check type is defined. By default we asumme is a string
            elif not 'type' in config[key]:
                config[key]['type'] = 'string'


    # Set enabled
    config['enabled'] = {"description": "If false. This plugin will not be used", 'type': 'bool', 'value': True, 'system_required': True}
    response = {'version': imported.constants.version, 'config': config}
    

    return sendResponse(jsonify(response))

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

# Has been copied. Should be improved in the future to reuse code
def setupPlugin(key, values):

    def font_path(layout):
        '''add font path to layout'''
        for k, block in layout.items():
            font = block.get('font', None)
            if font:
                font = font.format(constants.FONTS)
                block['font'] = font
        return layout

    cache = CacheFiles(path_prefix=constants.APP_NAME)
    plugin_config = {}
    # populate the kwargs plugin_config dict that will be passed to the Plugin() object
    plugin_config['name'] = key
    plugin_config['resolution'] = (800, 600)
    plugin_config['config'] = values
    plugin_config['cache'] = cache
    plugin_config['force_onebit'] = False #config['main']['force_onebit']
    plugin_config['screen_mode'] = 'RGB' #config['main']['screen_mode']
    plugin_config['plugin_timeout'] = 35
            # force layout to one-bit mode for non-HD screens
#             if not config['main'].get('display_type') == 'HD':
#                 plugin_config['force_onebit'] = True

    logging.debug(f'plugin_config: {plugin_config}')
    
    try:
        module = import_module(f'{constants.PLUGINS}.{values["plugin"]}')
        plugin_config['update_function'] = module.update_function
        layout = getattr(module.layout, values['layout'])
        layout = font_path(layout)
        plugin_config['layout'] = layout
    except KeyError as e:
        logger.info('no module specified; skipping update_function and layout')
    except ModuleNotFoundError as e:
        logger.warning(f'error: {e} while loading module {constants.PLUGINS}.{values["plugin"]}')
        logger.warning(f'skipping plugin')

    except AttributeError as e:
        logger.warning(f'could not find layout "{plugin_config["layout"]}" in {plugin_config["name"]}')
        logger.warning(f'skipping plugin')

    my_plugin = Plugin(**plugin_config)
    try:
        my_plugin.update()
    except AttributeError as e:
        logger.warning(f'ignoring plugin {my_plugin.name} due to missing update_function')
        logger.warning(f'plugin threw error: {e}')
 
    logger.info(f'appending plugin {my_plugin.name}')

    my_plugin.update()
    print("Getting image")
    return my_plugin.image