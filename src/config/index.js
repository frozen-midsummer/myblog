import setting from "./setting.config";
import theme from "./theme.config";
import network from "./net.config";

const config = {
  ...setting,
  ...theme,
  ...network,
};

export default config;
