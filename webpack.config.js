const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: path.join(__dirname, "src/index.js"),
    zedd: path.join(__dirname, "src/zedd.js")
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
    new HtmlWebpackPlugin({
      chunks: ["index"],
      template: path.join(__dirname, "src/index.html")
    }),
    new HtmlWebpackPlugin({
      chunks: ["zedd"],
      template: path.join(__dirname, "src/index.html"),
      filename: "zedd.html"
    })
  ]
};
