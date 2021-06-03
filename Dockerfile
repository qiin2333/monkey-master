# Dockerfile
FROM hayd/deno:1.5.2

COPY . server/

WORKDIR /app

ADD . /app

CMD deno run --allow-env --allow-read --allow-write --allow-net --allow-run --allow-plugin --unstable --no-check index.js
