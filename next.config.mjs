import path from 'node:path';
const nextConfig={distDir:process.env.NODE_ENV==='production'?'.next-v8-isolated-final':`.next-dev-${process.env.PORT||4173}`,turbopack:{root:path.resolve('.')},serverExternalPackages:['node:sqlite'],experimental:{cpus:1}};
export default nextConfig;
