import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  entry: {
    main: './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['postcss-loader'],
        type: 'css',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
      title: 'OpenShift Console',
    }),
    isDev && new ReactRefreshPlugin(),
  ].filter(Boolean),
  optimization: {
    minimize: !isDev,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20,
        },
      },
    },
  },
  devServer: {
    port: 9000,
    hot: true,
    historyApiFallback: true,
    open: true,
    proxy: [
      {
        context: ['/api/kubernetes'],
        target: process.env.K8S_API_URL || 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        pathRewrite: (path: string) => path.replace(/^\/api\/kubernetes/, ''),
      },
    ],
  },
  performance: {
    hints: false,
  },
  experiments: {
    css: true,
  },
});
