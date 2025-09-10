import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Webpack configuration (used when not using Turbopack)
  webpack: (config, { isServer }) => {
    // Handle missing optional dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@opentelemetry/exporter-jaeger': false,
      '@genkit-ai/firebase': false,
    };

    // Ignore specific modules that cause warnings
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/,
      /Module not found: Can't resolve '@genkit-ai\/firebase'/,
      /require\.extensions is not supported by webpack/,
    ];

    // Handle handlebars compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
  // Turbopack configuration (used when using --turbopack flag)
  turbopack: {
    resolveAlias: {
      // Handle missing optional dependencies for Turbopack
      '@opentelemetry/exporter-jaeger': './src/lib/empty-module.js',
      '@genkit-ai/firebase': './src/lib/empty-module.js',
    },
    resolveExtensions: [
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
};

export default nextConfig;
