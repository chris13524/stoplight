FROM denoland/deno
WORKDIR /app
USER deno
ADD . .
RUN deno cache main.ts
CMD ["run", "--allow-env", "--allow-net", "main.ts"]
