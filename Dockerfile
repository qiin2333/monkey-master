# Dockerfile
FROM ubuntu:18.04

RUN ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

RUN apt-get update && apt-get install -y sudo; sudo apt-get update && sudo apt-get -y install curl unzip tzdata;curl -fsSL https://deno.land/x/install/install.sh | sh;

WORKDIR /app

ADD . /app

ENV DENO_INSTALL="/root/.deno"

ENV PATH="$DENO_INSTALL/bin:$PATH"


CMD deno run --allow-env --allow-read --allow-write --allow-net --allow-run --unstable --no-check index.js
