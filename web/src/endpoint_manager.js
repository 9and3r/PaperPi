const ENDPOINTS_HOST = "http://localhost:4000";

const loadPlugins = async () => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/plugins/list");
  return await response.json();
};

const getConfig = async () => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/config");
  return await response.json();
};

const getLayouts = async (plugin) => {
  let response = await fetch(
    ENDPOINTS_HOST + "/endpoints/plugins/" + plugin + "/layouts"
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

export { loadPlugins, getConfig, getLayouts, sendConfig };
