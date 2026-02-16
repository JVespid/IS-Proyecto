/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración experimental para mejorar el rendimiento
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Logging detallado para debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
