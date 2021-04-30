// eslint-disable-next-line @typescript-eslint/no-var-requires
const CracoAntDesignPlugin = require("craco-antd");

// Don't open the browser during development
process.env.BROWSER = "none";

module.exports = {
  plugins: [
    {
      plugin: CracoAntDesignPlugin,
      options: {
        customizeTheme: {
          '@layout-body-background': '#fff'
        },
      },
    },
  ],
};
