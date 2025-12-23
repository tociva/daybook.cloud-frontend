# DaybookCloudFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.11.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Icon list
* https://icons.getbootstrap.com/



## Map a Custom Domain to Localhost with HTTPS using NGINX (Windows)

This guide explains how to map a custom domain like  
`app-local.daybook.cloud` to `localhost` and configure **HTTPS + reverse proxy** using **NGINX on Windows**.

---

### Prerequisites

- Windows 10 / 11
- Administrator access
- A local app running on `http://localhost:4200`

---

## Install NGINX on Windows

NGINX is used as a reverse proxy to forward HTTPS requests to the local app.

### Download NGINX for Windows

1. Download NGINX(stable version) from the official site: `https://nginx.org/en/download.html`

2. Extract it to a directory : C:\nginx\

---

### Install mkcert to Generate Local SSL

1. Download mkcert (Windows EXE): `https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe`

2. Put mkcert.exe in nginx folder then open command prompt

```bash
mkcert -install
mkcert app-local.daybook.cloud
```
3. This command generates `app-local.daybook.cloud.pem` (certificate) and `app-local.daybook.cloud-key.pem` (private key); move both files to `C:\nginx\certs\`.

---

### Edit the Windows hosts file

1. Open Notepad as Administrator (right-click Notepad > Run as administrator).
2. In Notepad, click File → Open.
3. Navigate to: C:\Windows\System32\drivers\etc\.
4. Change file type to "All Files(.)".
5. Select hosts and click Open

---

#### Add Domain Mapping

At the end of the hosts file, add the following lines then Save it:

```txt
127.0.0.1   app-local.daybook.cloud
::1   app-local.daybook.cloud(optional)
```
---

#### Flush DNS Cache
1. Open Command Prompt as Administrator.
2. Run: ipconfig/flushdns

---

#### Verify the Setup
1. Open a browser and visit http://app-local.daybook.cloud. 

---

### Configure NGINX Reverse Proxy

1. Open - C:\nginx\conf\nginx.conf

2. last line add this:

server {
    listen 443 ssl;
    server_name app-local.daybook.cloud;

    ssl_certificate     C:/nginx/certs/app-local.daybook.cloud.pem;
    ssl_certificate_key C:/nginx/certs/app-local.daybook.cloud-key.pem;

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $remote_addr;

    }
}

<!--  Optional HTTP → HTTPS redirect -->
server {
    listen 80;
    server_name app-local.daybook.cloud;
    return 301 https://$host$request_uri;
}


---

### Start NGINX

Open Command Prompt (Admin):

```bash
cd C:\nginx
# Start server
nginx.exe

# Reload server
nginx.exe -s reload

# Stop server
nginx.exe -s stop

# Test configuration
nginx -t

# Check if NGINX is running
tasklist | findstr nginx
```

---

### Start Test 

Open browser:

https://app-local.daybook.cloud

---


