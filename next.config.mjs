import path from 'node:path';
const nextConfig={distDir:process.env.VERCEL?'.next':process.env.NODE_ENV==='production'?'.next-v8-isolated-final':`.next-dev-${process.env.PORT||4173}`,turbopack:{root:path.resolve('.')},serverExternalPackages:['firebase-admin'],experimental:{cpus:1},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}]}};
export default nextConfig;
