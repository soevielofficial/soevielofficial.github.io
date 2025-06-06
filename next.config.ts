/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  output: 'export',
  distDir: "dist",
  basePath: process.env.GITHUB_ACTIONS ? "/soevielofficial.github.io" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/soevielofficial.github.io/" : "",
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig