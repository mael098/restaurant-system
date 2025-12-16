/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Permitir conexiones desde la red local para desarrollo
  allowedDevOrigins: [
    '192.168.1.73',
    '192.168.1.86',
    'localhost',
    '127.0.0.1'
  ],
  // Optimizaciones de rendimiento
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Configuración de compresión
  compress: true,
  // Reducir JavaScript no utilizado
  swcMinify: true,
  // Optimizar fuentes
  optimizeFonts: true,
}

export default nextConfig
