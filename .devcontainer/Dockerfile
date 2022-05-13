FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-16
USER node

RUN curl -fsSL https://deno.land/install.sh | sh
ENV PATH="/home/node/.deno/bin:$PATH"

RUN curl -fSs https://get-nats.io/install.sh | sh

USER root
