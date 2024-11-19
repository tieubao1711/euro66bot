module.exports = {
    apps: [
      {
        name: "telegram-bot",
        script: "dist/index.js",
        watch: false, // Tắt watch nếu sử dụng TypeScript để biên dịch
        autorestart: true,
        env: {
          NODE_ENV: "production"
        }
      }
    ]
  };
  