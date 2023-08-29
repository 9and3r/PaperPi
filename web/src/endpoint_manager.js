const ENDPOINTS_HOST = "http://localhost:4000";

const loadPlugins = async () => {
  let response = await fetch(ENDPOINTS_HOST + "/endpoints/plugins/list");
  return await response.json();
};

const getConfig = async () => {
  let fakeConfig = {
    main: { display_type: "HD", screen_mode: "L" },
    plugins: {},
  };
  return Promise.resolve(fakeConfig);
};

export { loadPlugins, getConfig };
