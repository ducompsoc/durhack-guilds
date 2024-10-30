const instanceName = process.env.INSTANCE_NAME;
if (!instanceName) throw new Error("INSTANCE_NAME is undefined")

module.exports = {
  apps: [
    {
      name: `${instanceName}-client`,
      script: "pnpm start",
      cwd: "./client",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: `${instanceName}-server`,
      script: "./dist/main.js",
      cwd: "./server",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
