# durhack-guilds

[![Continuous Integration](https://github.com/ducompsoc/durhack-guilds/actions/workflows/ci.yml/badge.svg)](https://github.com/ducompsoc/durhack-guilds/actions/workflows/ci.yml)

DurHack's 'Guilds' platform, built in-house by the DurHack team (2023-present).

## Stack
- `client` is a Next.js app using TypeScript and TailwindCSS, runs on Node.js
- `server` is an otterhttp (similar to Express) app using TypeScript, runs on Node.js
  - `server` requires access to a postgresql database for persistence/session management
- Nginx is used to direct incoming requests to the appropriate app

### Tooling
- We use `pnpm` for package management

## Nginx Configuration
```
server {
    server_name guilds.durhack.com www.guilds.durhack.com;
    
    location /api {
        proxy_pass http://127.0.0.1:3101$request_uri;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme; 
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:3101$request_uri;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme; 
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://127.0.0.1:3100$request_uri;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme; 
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen [::]:80;
    listen 80;
}
```
