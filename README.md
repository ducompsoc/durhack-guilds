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
    server_name megateams.durhack.com www.megateams.durhack.com;
    
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

## mysql server

Make sure you are running a [mysql server](https://dev.mysql.com/doc/refman/8.1/en/installing.html) 
on your machine before trying to run the project otherwise you will get connection refused errors etc.
as the javascript can't find a server to connect to on your localhost 🥲.

If your computer's `hosts` file contains `::1 localhost` (IPv6 local loopback) then you will need to use 
`127.0.0.1` as the database host, as the IPv6 spec clashes with the port spec (`::1:3306` is recognised as an IPv6 address,
not an address followed by a port).

This server should also have an appropriate user with permissions to manage the database, e.g.
```sql
CREATE USER 'durhack'@'localhost' IDENTIFIED BY 'durhack';
GRANT ALL PRIVILEGES ON durhack2023megateams.* TO 'durhack'@'localhost'
```
_This follows the naming used in the `.env.local` file given above_


## environment options
- `MEGATEAMS_SKIP_EMAIL_VERIFICATION`: set to `true` to allow users to set their password without verifying email
- `MEGATEAMS_NO_MITIGATE_CSRF`: set to `true` to allow `POST/PATCH/DELETE` (etc.) requests 
_without_ a CSRF hash cookie and token header.
