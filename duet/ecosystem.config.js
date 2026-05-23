module.exports = {
  apps: [
    {
      name: "duet-ngrok",
      script: "ngrok",
      args: "start duet",
      interpreter: "none",
      autorestart: true,
      watch: false,
    },
    {
      name: "duet-web",
      cwd: "./apps/web",
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      watch: false,
    },
    {
      name: "duet-worker",
      cwd: "./apps/worker",
      script: "npx",
      args: "tsx src/index.ts",
      interpreter: "none",
      autorestart: true,
      watch: false,
    },
  ],
};
