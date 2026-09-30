module.exports = {
  apps: [
    {
      name: 'korjong',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3001', //ให้ nextjs รับรีเควสเฉพาะจากภายในเครื่อง (localhost หรือ 127.0.0.1)
      instances: 1, // Single-instance is recommended for Next.js App Router caching
      exec_mode: 'fork', 
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
}
