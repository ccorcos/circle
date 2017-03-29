const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const prod = process.argv.indexOf("-p") !== -1;

module.exports = {
  entry: {
    index: path.join(__dirname, "src/index.js")
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      },
      {
        test: /\.m4a$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    prod
      ? new FaviconsWebpackPlugin(path.join(__dirname, "assets/logo.png"))
      : () => {},
    new HtmlWebpackPlugin({
      chunks: ["index"],
      template: path.join(__dirname, "src/index.html")
    })
  ]
};
