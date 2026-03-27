const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./static/frontend"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
           options: {
             sourceType: "unambiguous"
            }
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
           options: {
             sourceType: "unambiguous"
            }
        },
      },
      {
        test: /\.css$/i,
        use: ["css-loader"],
      },
      {
        test: /\.svg$/,
        type: 'asset/resource'
      },
    ],
  },
  optimization: {
    minimize: true,
  },
};