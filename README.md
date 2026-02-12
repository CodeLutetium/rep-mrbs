# REP Meeting Room Booking System (MRBS)

This repository contains the source code for the updated REP Meeting Room Booking System (MRBS). The website link is [here](https://rep-mrbs-1.fly.dev).

## Folders
| Folder | Purpose |
|--------|---------|
|[cpp-mrbs-be (archived)](https://github.com/CodeLutetium/rep-mrbs/tree/main/cpp-mrbs-be%20(archived)) | Old cpp source code with Drogon web framework - I was about 25% done then I thought of switching to Golang as it will be more maintainable for others |
|[mrbs-backend](https://github.com/CodeLutetium/rep-mrbs/tree/main/mrbs-backend)| Backend code and logic written in Golang - the backend server serves the webpages too. |
|[mrbs-redirect](https://github.com/CodeLutetium/rep-mrbs/tree/main/mrbs-redirect) | Simple nginx configuration to redirect users from the old [rep-mrbs.fly.dev](rep-mrbs.fly.dev) site to the new site. |
|[mrbs-ui](https://github.com/CodeLutetium/rep-mrbs/tree/main/mrbs-ui)| Frontend code written in Vite and React - use `pnpm build` and move the build into the backend code for deployment. |

## Deployment
### 1. Build frontend package in the ui directory
```sh
cd mrbs-ui
pnpm build
```
This will generate a `dist` directory with the build in `/mrbs-ui`. 

### 2. Move the build into the backend directory.
```sh
mv dist ../mrbs-backend
```

### 3. Deploy from backend directory
```sh
cd ../mrbs-backend
fly deploy
```
This will require `flyctl` to be installed on your computer. If you do not have it, you can run `brew install flyctl` (MacOS/Linux) to install it. 

Reference: [Install flyctl](https://fly.io/docs/flyctl/install/)
