const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: ".",
  output: {
    path: path.resolve(__dirname, "docs"),
    filename: "[name].js",
  },
  target: "web",
  plugins: [
    new HtmlWebpackPlugin({
      title: "Fighting Boxes",
      template: "./index.html",
    }),
  ],
};
