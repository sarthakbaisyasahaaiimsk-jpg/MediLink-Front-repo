// App parameters configuration

const isNode = typeof window === "undefined";

const storage = isNode ? null : window.localStorage;

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {}
) => {
  if (isNode) {
    return defaultValue;
  }

  const storageKey = `medilink_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${
      urlParams.toString() ? `?${urlParams.toString()}` : ""
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    storage?.setItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue) {
    storage?.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  const storedValue = storage?.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }

  return null;
};

const getAppParams = () => {
  // Clear auth token if requested
  if (getAppParamValue("clear_access_token") === "true") {
    storage?.removeItem("medilink_access_token");
    storage?.removeItem("authToken");
  }

  return {
    apiBaseUrl: getAppParamValue("api_base_url", {
      defaultValue: import.meta.env.VITE_API_BASE_URL,
    }),
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    fromUrl: getAppParamValue("from_url", {
      defaultValue: window.location.href,
    }),
  };
};

// ✅ SINGLE EXPORT ONLY (FIXED)
export const appParams = getAppParams();

export default appParams;