import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 允许 localtunnel / ngrok 等隧道服务的域名访问 dev 资源
  // 通配符支持 localtunnel 每次启动换的随机子域名
  allowedDevOrigins: [
    '*.loca.lt',
    '*.ngrok-free.app',
    '*.ngrok.app',
  ],
};

export default nextConfig;
