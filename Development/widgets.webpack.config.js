const Path = require('path')

module.exports = {
  mode: 'development',
  entry: {
    main: Path.resolve(__dirname, '../Widgets/Sources/MainWidget.js')
  },
  output: {
    filename: '[name].widget.js',
    path: Path.resolve(__dirname, './Stage')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  }
}
