const ENDPOINTS_HOST = "http://localhost:4000";

const loadPlugins = async () => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/plugins/list");
  return await response.json();
};

const getConfig = async () => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/config");
  return await response.json();
};

const getMainConfigInfo = async () => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/config/main/info");
  return await response.json();
};

const getPluginConfig = async (plugin) => {
  let response = await fetch(
    ENDPOINTS_HOST + "/endpoints/plugins/" + plugin + "/info"
  );
  return await response.json();
};

const sendConfig = async (config) => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/config", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(config),
  });
  return await response.json();
};

const testPlugin = async (plugin, config) => {
  let response = await fetch(
    ENDPOINTS_HOST + "/endpoints/plugins/" + plugin + "/test",
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(config),
    }
  );
  return URL.createObjectURL(await response.blob());
};

const getPluginSampleImageUrl = (plugin) => {
  return ENDPOINTS_HOST + "/endpoints/plugins/" + plugin + "/sample_image";
};

export {
  loadPlugins,
  getConfig,
  getPluginConfig,
  sendConfig,
  testPlugin,
  getPluginSampleImageUrl,
  getMainConfigInfo,
};
