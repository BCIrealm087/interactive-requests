const path = require('path');

const cssFiles = {};

module.exports = {
  entry: './index.ts', // Your entry file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js', // The main file that users will import
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        type: 'asset/resource',
        generator: {
          filename: (pathData) => {
            const { module } = pathData;
            const issuer = module.issuer;
        
            if (issuer && issuer.resource) {
              const relativeIssuerPath = path.relative(
                path.resolve(__dirname, 'src'),
                issuer.resource
              );
              const issuerDir = path.dirname(relativeIssuerPath);
              const issuerName = path.parse(path.basename(relativeIssuerPath)).name;
              const entry = issuerDir+issuerName;

              if (!(entry in cssFiles))
                cssFiles[entry] = 0;

              const output = `css/${issuerDir}/${issuerName}.${cssFiles[entry]}[ext]`;
              if (module.buildInfo.fullContentHash)
                cssFiles[entry]+=1;

              return output;
            }
        
            return 'css/[contenthash][ext]';
          },
        },
      },
    ],
  },
  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'React',
      root: 'React',
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'ReactDOM',
      root: 'ReactDOM',
    },
  },
};