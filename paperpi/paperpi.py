#!/usr/bin/env python3
# coding: utf-8






import logging
import logging.config
import sys
import shutil
import json
from json import JSONDecodeError
from itertools import cycle
from inspect import getfullargspec
from importlib import import_module
from pathlib import Path
from distutils.util import strtobool
from time import sleep
from configparser import DuplicateSectionError
from configparser import Error as ConfigParserError
import jsonmerge
from dictor import dictor
from jsonpath_ng import jsonpath, parse
from server import startServer





import ArgConfigParse
from epdlib import Screen
from epdlib.Screen import Update
from epdlib.Screen import ScreenError






from library.Plugin import Plugin
from library.CacheFiles import CacheFiles
from library.InterruptHandler import InterruptHandler
from library import get_help
from library import run_module
import my_constants as constants






# load the logging configuration
logging.config.fileConfig(constants.LOGGING_CONFIG)
logger = logging.getLogger(__name__)






def do_exit(status=0, message=None, **kwargs):
    '''exit with optional message
    Args:
        status(int): integers > 0 exit with optional message
        message(str): optional message to print'''
    if message:
        if status > 0:
            logger.error(f'failure caused exit: {message}')
        border = '\n'+'#'*70 + '\n'
        message = border + message + border + '\n***Exiting***'
        print(message)
        
    try:
        sys.exit(status)
    except Exception as e:
        pass






# def config_str_to_val(config):
#     '''convert strings in config dictionary into appropriate types
#              float like strings ('7.1', '100.2', '-1.3') -> to float
#              int like strings ('1', '100', -12) -> int
#              boolean like strings (yes, no, Y, t, f, on, off) -> 0 or 1
             
#          Args:
#              config(`dict`): nested config.ini style dictionary

#          Returns:
#              `dict`'''    

#     def eval_expression(string):
#         '''safely evaluate strings allowing only specific names
#         see: https://realpython.com/python-eval-function/
        
#         e.g. "2**3" -> 8; "True" -> True; '-10.23' -> 10.23
        
#         Args:
#             string(str): string to attempt to evaluate
            
#         Returns:
#             evaluated as bool, int, real, etc.'''
        
#         # set dict of allowed strings to and related names e.g. {"len": len}
#         allowed_names = {}
        
#         # compile the string into bytecode
#         code = compile(string, "<string>", "eval")
        
#         # check .co_names on the bytecode object to make sure it only contains allowed names
#         for name in code.co_names:
#             if name not in allowed_names:
#                 # raise a NameError for any name that's not allowed
#                 raise NameError(f'use of {name} not allowed')
#         return eval(code, {"__builtins__": {}}, allowed_names)
    
#     def convert(d, function, exceptions):
#         '''convert value strings in dictionary to appropriate type using `function`
        
#         d(dict): dictionary of dictionary of key/value pairs
#         function(`func`): type to convert d into
#         exceptions(tuple of Exceptions): tuple of exception types to ignore'''
#         for section, values in d.items():
#             for key, value in values.items():
#                 if isinstance(value, str):
#                     try:
#                         sanitized = function(value)
#                     except exceptions:
#                         sanitized = value

#                     d[section][key] = sanitized
#                 else:
#                     d[section][key] = value
#         return d
    
#     # evaluate int, float, basic math: 2+2, 2**15, 23.2 - 19
#     convert(config, eval_expression, (NameError, SyntaxError))
#     # convert remaining strings into booleans (if possible)
#     # use the distuitls strtobool function
#     convert(config, strtobool, (ValueError, AttributeError))
    
#     # return converted values and original strings
    
#     return config






def get_cmd_line_args():
    '''process command line arguments
    
    Returns:
        dict of parsed config values'''
    
    cmd_args = ArgConfigParse.CmdArgs()
    
#     cmd_args.add_argument('--add_config', 
#                          required=False, default=None, nargs=2,
#                          metavar=('plugin', 'user|daemon'),
#                          ignore_none = True,
#                          help='copy sample config to the user or daemon configuration file')    
    
    cmd_args.add_argument('-c', '--config', ignore_none=True, metavar='CONFIG_FILE.ini',
                         type=str, dest='user_config',
                         help='use the specified configuration file')
    
    cmd_args.add_argument('-C', '--compatible', required=False,
                         default=False, action='store_true', 
                         help='list compatible displays and exit')
    
    cmd_args.add_argument('-l', '--log_level', ignore_none=True, metavar='LOG_LEVEL',
                         type=str, choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                         dest='main__log_level', help='change the log output level')
    
    cmd_args.add_argument('-d', '--daemon', required=False, default=False,
                         dest='main__daemon', action='store_true', 
                         help='run in daemon mode (ignore user configuration if found)')    
    
    cmd_args.add_argument('--list_plugins', required=False,
                         default=False, action='store_true', 
                         help='list all available plugins')

    cmd_args.add_argument('--plugin_info', metavar='[plugin|plugin.function]',
                         required=False, default=None,
                         ignore_none=True,
                         help='get information for plugins and user-facing functions provided by a plugin')   
    
    cmd_args.add_argument('--run_plugin_func',
                         required=False, default=None, nargs='+',
                         metavar=('plugin.function', 'optional_arg1 arg2 argN'),
                         ignore_none=True,
                         help='run a user-facing function for a plugin')
    
    cmd_args.add_argument('-V', '--version', required=False, default=False, ignore_false=True,
                          action='store_true',
                          help='display version and exit')
    
    cmd_args.parse_args()    

    return cmd_args






def get_config_files(cmd_args=None):
    '''Load json configuration files and merge options destructively
    
    Args:
        cmd_args(`ArgConfigPars.CmdArgs` obj)
        
    Returns:
        json dict of configuration
    
    '''
    # FIXME - consider removing ArgConfigParse and switching to standard python lib
    

    # all the possible config files
    config_files_dict = {
        'base': constants.CONFIG_BASE,
        'system': constants.CONFIG_SYSTEM,
        'user': constants.CONFIG_USER,
        'cmd_line': None
    }
    
    # always include the base configuration file
    config_files_list = [config_files_dict['base']]

    json_config = {}
    
    json_config['config_files'] = config_files_list
    
    
    try:
        daemon_mode = cmd_args.options.main__daemon
    except AttributeError:
        logging.info(f'daemon mode not set')
        daemon_mode = False
    
    # use the user provided config file if possible
    try:
        config_file_user = cmd_args.options.user_config
    except AttributeError:
        logging.debug('no user specified config file')
        user_config_file = None
    else:
        config_files_dict['cmd_line'] = config_file_user
        
    if config_files_dict['cmd_line']:
        if daemon_mode:
            logging.warning(f'daemon mode was set, but is ignored due to user specified config file')
        config_files_list.append(config_files_dict['cmd_line'])
    elif daemon_mode:
        config_files_list.append(config_files_dict['system'])
    else:
        config_files_list.append(config_files_dict['user'])
        if not config_files_dict['user'].exists():
            try:
                constants.CONFIG_USER.parent.mkdir(parents=True, exist_ok=True)
            except PermissionError as e:
                msg=f'could not create user configuration directory: {constants.CONFIG_USER.parent}'
                logger.critical(msg)
                do_exit(1, msg)
            try:
                shutil.copy(constants.CONFIG_BASE, constants.CONFIG_USER)
            except Exception as e:
                msg=f'could not copy user configuration file to {constants.CONFIG_USER}'
                logging.critical(1, msg)
                do_exit(1, msg)
            
    logging.debug(f'using config files: {config_files_list}')
        
    for cfg_file in config_files_list:
        logging.info(f'parsing {cfg_file}')
        try:
            with open(cfg_file) as f:
                data = json.load(f)
        except OSError as e:
            logging.warning(f'failed to load config file: {e}')
            data = {}
        except JSONDecodeError as e:
            logging.warning(f'error in JSON file "{f.name}": {e}')
            data = {}
        logging.debug(f'data: {data}')
        json_config = jsonmerge.merge(json_config, data)
    
    # convert command line options into 'key' {'value': value} format
    # this is a little round-about, but keeps all of the merging in one place
    cmd_options_dict = {}
    
    try:
        cmd_nested_dict = cmd_args.nested_opts_dict
    except AttributeError:
        logging.warning('cmd_args: invalid ArgConfigParse.CmdArgs object')
        cmd_nested_dict = None
    
    if isinstance(cmd_nested_dict, dict):
        for section, options in cmd_nested_dict.items():
            cmd_options_dict[section] = {}
            try:
                for key, value in options.items():
                    cmd_options_dict[section][key] = {"value": value}
            except AttributeError as e:
                logging.warning(f'{e}: skipping unparsable command arg: {section}: {options}')
   
    # merge command lines options into main configuration
    try:
        json_config = jsonmerge.merge(json_config, cmd_options_dict)
    except AttributeError:
        logging.debug(f'ArgConfigPars.CmdArgs object was not provided or was malformed')
    
    
    return json_config
            
    






def parse_config(json_config=None):
    '''Parse configuration file and return only the values for each dictionary entry
    
    Args:
        json_config(`dict`): json formatted configuration file
        
    Returns:
        dict of dict key/values
        '''
    logging.debug('processing configuration values')    
    parsed_config = {}
    
    if not isinstance(json_config, dict):
        logging.error('no valid JSON data passed')
        return parsed_config

    # match all keys
    key_expression = parse('$[*].*')
    # search specifically for the key 'value'
    value_expression = parse('$.value')


    # process all the expected sections in the config
    for section in constants.CONFIG_SECTIONS:
        logging.debug(f'section: {section}')
        
        # set the jsonpath search string
        jsonpath_expression = parse(f'$.{section}.[*]')
        # find all matching 
        try:
            section_vals = [match.value for match in jsonpath_expression.find(json_config)]
        except TypeError:
            # pass over key: value sections that have no depth (e.g. config_version: 2.0)
            parsed_config[section] = json_config[section]
            continue
        
        # create a list of extracted dictionary values
        extracted_values = []
        
        for each in section_vals:
            value_dict = {}
            
            # process all the matched values extracted from the section
            for match in key_expression.find(each):
                # further process dictionaries to find the `value` key
                if isinstance(match.value, dict):
                    my_match = value_expression.find(match.value)[0].value
                else:
                    # else take the flat value
                    my_match = match.value
                    
                value_dict[str(match.path)] = my_match
            extracted_values.append(value_dict)
            
        # flatten out the main section into a dict
        if section == 'main':
            parsed_config[section] = extracted_values[0]
        else:
            parsed_config[section] = extracted_values
    
    
    return parsed_config






# def parse_config(json_config=None):
#     '''Parse configuration file and return only the values for each dictionary entry
    
#     Args:
#         json_config(`dict`): json formatted configuration file
        
#     Returns:
#         dict of dict key/values
#         '''
    
#     if not isinstance(json_config, dict):
#         logging.error('config file did not contain a valid json like object')
#         return None
    
#     parsed_config = {}
#     warnings = []
    
#     for section, section_keys in json_config.items():
#         logging.debug(f'processing section "{section}"')
#         parsed_config[section] = {}
#         if isinstance(section_keys, dict):
#             for config_opt, opt_keys in section_keys.items():
                
#                 for key, value in opt_keys.items():
#                     found_value = False
#                     if key == 'value':
#                         found_value = value
#                         logging.debug(f'found_value: {found_value}')
                    
#                 if found_value:
#                     parsed_config[section][config_opt][key] = found_value
#                 else:
#                     warnings.append(f'{section}[{key}] did not contain a value')
  
#         else:
#             logging.info(f'section "{section}" did not contain parsable values')
#             parsed_config[section] = section_keys
#             continue
        
        
#     print(warnings)
        
#     return parsed_config

        






# def get_config_files(cmd_args):
#     '''read config.ini style files(s)
    
#     Args: 
#         cmd_args(`ArgConfigParse.CmdArgs` obj)
        
#     Returns:
#         ArgConfigParse.ConfgifFile'''
    
#     config_files_dict = {'base': constants.CONFIG_BASE,
#                          'system': constants.CONFIG_SYSTEM,
#                          'user': constants.CONFIG_USER,
#                          'cmd_line': cmd_args.options.user_config}
    
#     config_files_list = [config_files_dict['base']]
    
#     if config_files_dict['cmd_line']:
#         config_file = config_files_dict['cmd_line']
#     else:
#         if cmd_args.options.main__daemon:
#             config_file = config_files_dict['system']
#         else:
#             config_file = config_files_dict['user']
#             if not config_file.exists():
#                 try:
#                     constants.CONFIG_USER.parent.mkdir(parents=True, exist_ok=True)
#                 except PermissionError as e:
#                     msg=f'could not create user configuration directory: {constants.CONFIG_USER.parent}'
#                     logger.critical(msg)
#                     do_exit(1, msg)
#                 try:
#                     shutil.copy(constants.CONFIG_BASE, constants.CONFIG_USER)
#                 except Exception as e:
#                     msg=f'could not copy user configuration file to {constants.CONFIG_USER}'
#                     logging.critical(1, msg)
#                     do_exit(1, msg)
#                 msg = f'''This appears to be the first time PaperPi has been run.
#     A user configuration file created: {constants.CONFIG_USER}
#     At minimum you edit this file and add a display_type and enable one plugin.

#     Edit the configuration file with:
#        $ nano {constants.CONFIG_USER}'''
#                 do_exit(0, msg)
        
#     config_files_list.append(config_file)
    
    
#     logger.info(f'using configuration files to configure PaperPi: {config_files_list}')
#     config_files = ArgConfigParse.ConfigFile(config_files_list, ignore_missing=True)
#     try:
#         config_files.parse_config()
#     except DuplicateSectionError as e:
#         logger.error(f'{e}')
#         config_files = None
#     except ConfigParserError as e:
#         logging.error(f'error processing config file: {e}')
#         config_files = None

#     return config_files
    






def clean_up(cache=None, screen=None, no_wipe=False):
    '''clean up the screen and cache
    
    Args:
        cache(cache obj): cache object to use for cleanup up
        screen(Screen obj): screen to clear
        no_wipe(bool): True - leave last image on screen; False - wipe screen
    '''
    logging.info('cleaning up')
    try:
        logging.debug('clearing cache')
        cache.cleanup()
    except AttributeError:
        logging.debug('no cache passed, skipping')
    
    if no_wipe:
        logging.info('not clearing screen due to [main][no_wipe]=True')
    else:
        try:
            logging.debug('clearing screen')
            screen.clearEPD()
        except AttributeError:
            logging.debug('no screen passed, skipping cleanup')
        
    logging.debug('cleanup completed')
    return    






# def build_plugins_list(config, resolution, cache):
#     '''Build a list of configured plugin objects
    
#     Args:
#         config(dict): configuration dictionary 
#         resolution(tuple): X, Y resolution of screen
#         cache(obj: Cache): cache object for managing downloads of images
        
#     Returns:
#         list of Plugin'''
    
#     def font_path(layout):
#         '''add font path to layout'''
#         for k, block in layout.items():
#             font = block.get('font', None)
#             if font:
#                 font = font.format(constants.FONTS)
#                 block['font'] = font
#         return layout
    
#     # always append the default plugin and ensure there is at least one plugin in the list
#     config['plugins'].append(
#             {'name': 'Default Plugin',
#              'plugin': 'default'}
#     )
#     plugin_list = config.get('plugins', [])
       
#     if not isinstance(plugin_list, list):
#         logging.error(f'missing or malformed "plugin" section in config file')
#         return None
    
#     # get the expected key-word args from the Plugin() spec
#     spec_kwargs = getfullargspec(Plugin).args
#     try:
#         spec_kwargs.remove('self')
#     except ValueError as e:
#         logging.warning(f'excpected to find kwarg `self` in kwargs: {e}')
    
#     logging.debug(f'Plugin() spec: {spec_kwargs}')

#     plugin_obj_list = []

#     logging.info(f'processing {len(plugin_list)} plugins from config file')
#     plugin_obj_list = []
    
#     for item in plugin_list:
#         if not isinstance(item, dict):
#             logging.error(f'bad plugin config found in {item}; skipping and attempting to recover')
#             logging.error(f'expected `dict` found: {type(item)}')
#             continue
           
#         logging.info(f'     >>>configuring {item.get("name", "UNKNOWN")} - {item.get("plugin", "UNKNOWN")}<<<')
#         if not item.get("enabled", True):
#             logging.info('plugin disabled and is not configured')
#             continue
            
#         # extract all of this into separate function 
#         plugin_config = {}
#         plugin_kwargs = {}
#         plugin_module = item.get('plugin', None)
#         for key, value in item.items():
#             if key in spec_kwargs:
#                 plugin_config[key] = value
#             else:
#                 plugin_kwargs[key] = value
        
#         # fill in the remaining kwargs
#         plugin_config['resolution'] = resolution
#         plugin_config['cache'] = cache
#         plugin_config['force_onebit'] = config['main']['force_onebit']
#         plugin_config['screen_mode'] = config['main']['screen_mode']
#         plugin_config['plugin_timeout'] = config['main'].get('plugin_timeout', 35)
#         # force layout to one-bit mode for non-HD screens
#         if not config['main'].get('display_type') == 'HD':
#             plugin_config['force_onebit'] = True
    
#         plugin_config['config'] = plugin_kwargs
#         logging.debug(f'plugin_config: {plugin_config}')
        
# #         plugin_obj_list.append(plugin_config)
        
#         try:
#             module = import_module(f'{constants.PLUGINS}.{plugin_module}')
#             plugin_config['update_function'] = module.update_function
#             layout = getattr(module.layout, plugin_config.get('layout', 'layout'))
#             layout = font_path(layout)
#             plugin_config['layout'] = layout
#         except KeyError as e:
#             logger.info('no module specified; skipping plugin')
#             continue
#         except ModuleNotFoundError as e:
#             logger.warning(f'error: {e} while loading module {constants.PLUGINS}.{values["plugin"]}')
#             logger.warning(f'skipping plugin')
#             continue
#         except AttributeError as e:
#             logger.warning(f'could not find layout "{plugin_config["layout"]}" in {plugin_config["name"]}')
#             logger.warning(f'skipping plugin')
#             continue
#         my_plugin = Plugin(**plugin_config)
#         try:
#             logging.debug('updating plugin')
#             my_plugin.update()
#         except AttributeError as e:
#             logger.warning(f'ignoring plugin {my_plugin.name} due to missing update_function')
#             logger.warning(f'plugin threw error: {e}')
#             continue    
    
#         plugin_obj_list.append(my_plugin)   
        
#     return plugin_obj_list      






def configure_plugin(main, config, resolution, cache):
    '''configure a single plugin
    
        Args:
        config(dict): configuration dictionary 
        resolution(tuple): X, Y resolution of screen
        cache(obj: Cache): cache object for managing downloads of images
        
    Returns:
        list of Plugin'''
    
    def font_path(layout):
        '''add font path to layout'''
        for k, block in layout.items():
            font = block.get('font', None)
            if font:
                font = font.format(constants.FONTS)
                block['font'] = font
        return layout    
    
    
    logging.info(f'     >>>configuring {config.get("name", "UNKNOWN")} - {config.get("plugin", "UNKNOWN")}<<<')    
    # get the expected key-word args from the Plugin() spec
    spec_kwargs = getfullargspec(Plugin).args
    try:
        spec_kwargs.remove('self')
    except ValueError as e:
        logging.warning(f'excpected to find kwarg `self` in kwargs: {e}')
    
    logging.debug(f'Plugin() spec: {spec_kwargs}')    
    
    
    plugin_config = {}
    plugin_kwargs = {}
    plugin_module = config.get('plugin', None)
    exceptions = []
    
#     main = config.get('main', {})
    
    for key, value in config.items():
        if key in spec_kwargs:
            plugin_config[key] = value
        else:
            plugin_kwargs[key] = value

    # fill in the remaining kwargs
    plugin_config['resolution'] = resolution
    plugin_config['cache'] = cache
    plugin_config['force_onebit'] = main.get('force_onebit', True)
    plugin_config['screen_mode'] = main.get('screen_mode', '1')
    plugin_config['plugin_timeout'] = main.get('plugin_timeout', 35)
    plugin_config['name'] = main.get('name', 'NO NAME')
    # force layout to one-bit mode for non-HD screens
    if not main.get('display_type', None) == 'HD':
        plugin_config['force_onebit'] = True

    plugin_config['config'] = plugin_kwargs
    logging.debug(f'plugin_config: {plugin_config}')
#     except KeyError as e:
#         msg = f'error configuring plugin: {e}'
#         logging.warning(msg)
#         exceptions.append(e)
        
    try:
        module = import_module(f'{constants.PLUGINS}.{plugin_module}')
        plugin_config['update_function'] = module.update_function
        layout = getattr(module.layout, plugin_config.get('layout', 'layout'))
        layout = font_path(layout)
        plugin_config['layout'] = layout
    except KeyError as e:
        msg = 'no module specified; skipping plugin'
        logger.warning(msg)
        exceptions.append(msg)
#         continue
    except ModuleNotFoundError as e:
        msg = f'error: {e} while loading plugin module; skipping plugin'
        logger.warning(msg)
        exceptions.append(msg)
#         continue
    except AttributeError as e:
        msg = f'could not find layout "{plugin_config["layout"]}" in {plugin_config["name"]}; skipping plugin'
        logger.warning(msg)
        exceptions.append(msg)
        

    try:
        logging.debug(f'creating plugin {plugin_config["name"]}')
        my_plugin = Plugin(**plugin_config)
    except TypeError as e:
        msg = f'failed to create plugin "{plugin_config["name"]}": {e}'
        logging.warning('msg')
        exceptions.append(msg)
        my_plugin = None
    
    try:
        logging.debug('updating plugin')
        my_plugin.update()
    except (AttributeError, TypeError) as e:
        msg = f'ignoring plugin "{plugin_config["name"]}" due to errors: {e}'
        logger.warning(msg)
        exceptions.append(msg)
        my_plugin = None

        
    if len(exceptions) > 0:
        logging.error(f'errors encountered while creating plugin:')
        for idx, e in enumerate(exceptions):
            logging.error(f'     {idx}: {e}')

            
    return my_plugin       






def setup_splash(config, resolution):
    if config['main'].get('splash', False):
        logger.debug('displaying splash screen')
        from plugins.splash_screen import splash_screen
        splash_config = {
            'name': 'Splash Screen',
            'layout': splash_screen.layout.layout,
            'update_function': splash_screen.update_function,
            'resolution': resolution,
        }
        splash = Plugin(**splash_config)
        splash.update(app_name=constants.APP_NAME, 
                      version=constants.VERSION, 
                      url=constants.URL)
    else:
        logger.debug('skipping splash screen')
        splash = False
    
    return splash






def setup_display(config):
    def ret_obj(obj=None, status=0, message=None):
        return{'obj': obj, 'status': status, 'message': message} 
    
    keyError_fmt = 'configuration KeyError: section[{}], key: {}'    
    
    moduleNotFoundError_fmt = 'could not load epd module {} -- error: {}'
    
    epd = config['main'].get('display_type', None)
    vcom = config['main'].get('vcom', None)
    mirror = config['main'].get('mirror', False)
        
    try:
        screen = Screen(epd=epd, vcom=vcom)
        # this may not be necessary; most writes necessarily involve wiping the screen
#         screen.clearEPD()
    except ScreenError as e:
        logging.critical('Error loading epd from configuration')
        return_val = ret_obj(None, 1, moduleNotFoundError_fmt.format(epd, e))
        return return_val
    except PermissionError as e:
        logging.critical(f'Error initializing EPD: {e}')
        logging.critical(f'The user executing {constants.app_name} does not have access to the SPI device.')
        return_val = ret_obj(None, 1, 'This user does not have access to the SPI group\nThis can typically be resolved by running:\n$ sudo groupadd <username> spi')
        return return_val
    except FileNotFoundError as e:
        logging.critical(f'Error initializing EPD: {e}')
        logging.critical(f'It appears that SPI is not enabled on this Pi. Try:')
        logging.critical(f'   $ sudo raspi-config nonint do_spi 0')
        return_val = ret_obj(None, 1, moduleNotFoundError_fmt.format(epd, e))
        return return_val
    
    
    try:
        screen.rotation = config['main'].get('rotation', 0)
    except (TypeError, ValueError) as e:
        logger.error('invalid screen rotation [main][rotation] - acceptable values are (0, 90, -90, 180)')
        return_val = ret_obj(None, 1, keyError_format.format('main', 'rotation'))
        return return_val
    
    try:
        screen.mirror = config['main'].get('mirror', False)
    except (TypeError, ValueError) as e:
        logger.error('invalid mirror value [main][mirror] - acceptable values are: (True, False)')
        return_val = ret_obj(None, 1, keyError_format.format('main', 'rotation'))
        return return_val
            
    
    return ret_obj(obj=screen)    






def update_loop(plugins, screen, max_refresh=5):
    def _update_plugins(force_update=False):
        '''private function for updating plugins'''
        s = ' '*5
        logger.info(f'>>__________UPDATING PLUGINS__________<<')
        logger.debug(f'{len(plugins)} total plugins available')
        my_priority_list = [2**16]
        for plugin in plugins:
            logger.info(f'{"#"*10}{plugin.name}{"#"*10}')
            if force_update:
                logger.info(f'{s}forcing update')
                plugin.force_update()
            else:
                plugin.update()

            logger.info(f'{s}PRIORITY: {plugin.priority} of max {plugin.max_priority}')
            my_priority_list.append(plugin.priority)

            logger.debug(f'{s}DATA: {len(plugin.data)} elements')
            logger.debug(f'{s}IMAGE: {plugin.image}')

        return my_priority_list
    
    logger.debug(f'max refresh before total wipe: {max_refresh}')
    
    logger.info(f'starting update loop with {len(plugins)} plugins')
    logger.debug(f'plugins: {plugins}')
    
    exit_code = 1
    priority_list = []
    priority_list = _update_plugins(force_update=True)
    # cycle to next item in list
    plugin_cycle = cycle(plugins)
    current_plugin = next(plugin_cycle)
    refresh_count = 0
    current_hash = ''
    # lower numbers are of greater importance
    max_priority = min(priority_list)
    last_priority = max_priority
    
    # display the first plugin with appropriately priority
    for i in range(0, len(plugins)):
        if current_plugin.priority <= max_priority:
            current_timer = Update()
            current_plugin_active = True
            logger.info(f'DISPLAY PLUGIUN: {current_plugin.name}')
            break
        else:
            current_plugin = next(plugin_cycle)
            
    interrupt_handler = InterruptHandler()
    while not interrupt_handler.kill_now:
        logger.info(f'{current_plugin.name}--display for: {current_plugin.min_display_time-current_timer.last_updated:.1f} of {current_plugin.min_display_time} seconds')
        
        priority_list = _update_plugins()
        last_priority = max_priority
        max_priority = min(priority_list)
        
        

        
        # if the timer has expired or the priority has increased, display a different plugin
        if current_timer.last_updated > current_plugin.min_display_time:
            logger.info(f'display time for {current_plugin} elapsed, cycling to next')
            current_plugin_active = False
        
        if max_priority > last_priority:
            logger.info(f'priority level increased; cycling to higher priority plugin')
            current_plugin_active = False
            
        
        if not current_plugin_active:
            logger.debug(f'{current_plugin} inactive; searching for next active plugin')
            for attempt in range(0, len(plugins)):
                current_plugin = next(plugin_cycle)
                logger.debug(f'checking plugin: {current_plugin}')
                if current_plugin.priority <= max_priority:
                    current_plugin_active = True
                    logger.debug(f'using plugin: {current_plugin}' )
                    current_timer.update()
                    break
    
        # check data-hash for plugin; only update screen if hash has changed to avoid uneccessary updates
        if current_hash != current_plugin.hash:
            logger.debug('data update required')
            current_hash = current_plugin.hash
            
            if refresh_count >= max_refresh-1 and screen.HD:
                logger.debug(f'{refresh_count} reached maximum of {max_refresh}')
                refresh_count = 0
                screen.clearEPD()
                
            try:
                screen.writeEPD(custom_ander_paint(current_plugin.image))
            except FileNotFoundError as e:
                msg = 'SPI does not appear to be enabled. Paperpi requires SPI access'
                logging.critical(msg)
                do_exit(1, msg)
            except ScreenError as e:
                logging.critical(f'{current_plugin.name} returned invalid image data; screen update skipped')
                logging.debug(f'DATA: {current_plugin.data}')
                logging.debug(f'IMAGE: {current_plugin.image}')
                logging.debug(f'IMAGE STRING: {str(current_plugin.image)}')
                current_plugin_active = False
        else:
            logging.debug('plugin data not refreshed, skipping screen update')

            
        
        sleep(constants.UPDATE_SLEEP)
        
    
    
from PIL import ImageDraw, ImageFont
from datetime import datetime
def custom_ander_paint(image):
    drawer = ImageDraw.Draw(image)
    font = ImageFont.truetype("Arial", 60)

    now = datetime.now()
    drawer.text((90, 30), now.strftime("%H:%M"), font=font)
    return image



def main():
    cmd_args = get_cmd_line_args()
        
    if hasattr(cmd_args, 'unknown'):
        print(f'Unknown arguments: {cmd_args.unknown}\n\n')
        cmd_args.parser.print_help()
        return

    
#     config_files = get_config_files(cmd_args)
    config_json = get_config_files(cmd_args)
    
    if not config_json:
        print('Fatal error collecting and processing configuration files. See the logs.')
        return 1
    
    config = parse_config(config_json)
    
    if not config:
        print('Fatal error parssing configuartion files. See the logs.')
        return 1    
 
    if cmd_args.options.version:
        print(constants.VERSION_STRING)
        return

    if cmd_args.options.compatible:
        print('Compatible WaveShare Displays:\n')
        Screen.list_compatible()
        return
    
    if cmd_args.options.list_plugins:
        get_help.get_help(plugin_path=Path(constants.BASE_DIRECTORY)/'plugins')
        return
    
    if cmd_args.options.plugin_info:
        get_help.get_help(cmd_args.options.plugin_info)
        return
    
    if cmd_args.options.run_plugin_func:
        run_module.run_module(cmd_args.options.run_plugin_func)
        return       
    
    log_level = config['main'].get('log_level', 'INFO')

    logger.info(f'********** {constants.APP_NAME} {constants.VERSION} Starting **********')
    if cmd_args.options.main__daemon:
        logger.info(f'{constants.APP_NAME} is running in daemon mode')
    else:
        logger.info(f'{constants.APP_NAME} is running in on-demand mode')
        
    logger.setLevel(log_level)
    logging.root.setLevel(log_level)

    logger.debug(f'configuration:\n{config}\n\n')
    
    screen_return = setup_display(config)
    
    if screen_return['obj']:
        screen = screen_return['obj']
    else:
        clean_up(None, None)
        logger.error(f'config files used: {config_files.config_files}')
        do_exit(**screen_return)
    
    # force to one-bit mode for non HD and non-color screens
    if screen.mode == '1' or not config['main'].get('color', True):
        one_bit = True
    else:
        one_bit = False
            
    config['main']['force_onebit'] = one_bit
    config['main']['screen_mode'] = screen.mode
    
    logging.info('screen configured')
            
    splash = setup_splash(config, screen.resolution)
    
    if splash:
        splash_kwargs = {
            'app_name': constants.APP_NAME,
            'version': constants.VERSION,
            'url': constants.URL            
        }
        splash.force_update(**splash_kwargs)
        logger.debug('display splash screen')
        try:
            screen.writeEPD(splash.image)
        except FileNotFoundError as e:
            msg = 'SPI does not appear to be enabled. Paperpi requires SPI access'
            logging.critical(msg)
            do_exit(1, msg)            
        except ScreenError as e:
            logging.critical(f'Could not write to EPD: {e}')
            
    cache = CacheFiles(path_prefix=constants.APP_NAME)

    startServer(config)
    
    
    # get a list of all the plugins
    plugin_list = config.get('plugins', [])
    
    # always append the default plugin and ensure there is at least one plugin in the list
    try:
        plugin_list.append(
            {'name': 'Default Plugin',
             'plugin': 'default'})
    except (AttributeError) as e:
        msg = f'error loading plugins: {e}'
        logging.error(msg)
        do_exit(1, msg)

    
    # list of plugin objects
    plugins = []
    
    if not isinstance(plugin_list, list):
        msg = f'missing or malformed "plugin" section in config file'
        logging.error(msg)
        do_exit(1, msg)
    
    for item in plugin_list:
        if not isinstance(item, dict):
            logging.error(f'bad plugin config found in {item}; skipping and attempting to recover')
            logging.error(f'expected `dict` found: {type(item)}')
            continue 
        
        
        p = configure_plugin(main=config.get('main', {}), config=item, resolution=screen.resolution, cache=cache)
        if p:
            plugins.append(p)
        else:
            logging.error(f'failed to create plugin due to previous errors')
    
#     plugins = build_plugins_list(config=config, resolution=screen.resolution, 
#                                 cache=cache)
    
#     return plugins
    
    if not plugins:
        msg = 'no plugins are configured; see previous errors. Exiting'
        do_exit(1, msg)
    
    exit_code = update_loop(plugins=plugins, screen=screen, max_refresh=config['main'].get('max_refresh', 5))
    
    clean_up(cache=cache, screen=screen, no_wipe=config['main'].get('no_wipe', False))
    
    return  exit_code






if __name__ == "__main__":
    # remove jupyter runtime junk for testing
    try:
        i = sys.argv.index('-f')
        t = sys.argv[:i] + sys.argv[i+2:]
        sys.argv = t
    except ValueError:
        pass
    exit_code = main()
    sys.exit(exit_code)




