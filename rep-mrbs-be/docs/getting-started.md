# Getting Started

This document will walk you through how to set up your environment for development. If you have already installed the dependency, you can skip the section.

This document is written for MacOS 15.6. If you are using other platforms, you are welcomed to add walkthrough steps to this document.

## Pre-requisites

- [Homebrew](https://brew.sh/) for MacOS users. (surely you already have this if you are intending to work on this project)
- [cmake](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html)
- [Docker](https://docs.docker.com/engine/install/) OR PostgreSQL

## Drogon

[Drogon](https://drogonframework.github.io/drogon-docs/#/ENG/ENG-02-Installation) is the web framework used in this application. Follow the installation steps to prepare your OS environment for installation, and install using **cpm.cmake**.

To install cpm.cmake, run:

```
mkdir -p cmake
wget -O cmake/CPM.cmake https://github.com/cpm-cmake/CPM.cmake/releases/latest/download/get_cpm.cmake
```

Installing the command line tool (drogon_ctl) is useful as well. For MacOS users, you can run `brew install drogon` to get the command line tool.

### Installing dg_ctl for MacOS

Follow the steps below for MacOS as `brew install drogon` may not be able to detect your PostgreSQL installation. **INSTALL PostgreSQL BEFORE installing drogon!!**

```
# Link libpq library
brew link --force libpq

# Install drogon from source
brew install --build-from-source drogon
```

## Goose

[Goose](https://github.com/pressly/goose) is the database migration tool used in this project.

## Docker

To save the hassle of setting up PostgreSQL on your machine, [Docker](https://docs.docker.com/engine/install/) is used.

Before starting the database, create a password file in `./db/password.txt`.

```
mkdir -p db
echo "your password" >> db/password.txt
```

To start the database, simply run:

```
docker compose up
```

| Future work: Dockerize entire application to simplify development setup.

# Building and Running the application

Generate the makefiles with

```
mkdir -p build && cd build
cmake ..
```

From the same directory, build the application with:

```
cmake --build .
```

To run the application, simply run:

```
./rep-mrbs-be
```
