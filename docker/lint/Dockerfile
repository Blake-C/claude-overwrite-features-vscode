FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5

# scripts/lint.sh --check-base compares this pin against alpinelinux.org/releases.json.
ARG ALPINE_VERSION=3.24.4

LABEL org.opencontainers.image.title="claude-overwrite-features lint" \
	org.opencontainers.image.description="ESLint and Prettier for claude-overwrite-features-vscode" \
	org.opencontainers.image.source="https://github.com/Blake-C/claude-overwrite-features-vscode" \
	com.digitalblake.project="claude-overwrite-features-vscode"

WORKDIR /opt/lint
COPY package.json package-lock.json ./

RUN apk upgrade --no-cache \
	&& test "$(cat /etc/alpine-release)" = "$ALPINE_VERSION" \
	&& npm ci --ignore-scripts --omit=optional --no-audit --no-fund --update-notifier=false \
	&& npm cache clean --force \
	&& rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm /tmp/* \
	&& rm -rf /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/cache/apk \
	&& find / -xdev -perm /6000 -type f -exec chmod a-s {} + \
	&& mkdir /opt/lint/work

ENV PATH=/opt/lint/node_modules/.bin:$PATH
WORKDIR /opt/lint/work
USER node
ENTRYPOINT []
CMD ["eslint", "."]
