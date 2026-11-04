FROM node:22-alpine

RUN apk add --no-cache bash tini

WORKDIR /app/uis/website
COPY uis/website/package*.json ./
RUN npm install

WORKDIR /app/uis/talent-pipeline-tracker
COPY uis/talent-pipeline-tracker/package*.json ./
RUN npm install

WORKDIR /app
COPY index.html apply.html i18n.js validation.js ./
COPY imagenes ./imagenes
COPY uis/website ./uis/website
COPY uis/talent-pipeline-tracker ./uis/talent-pipeline-tracker
COPY --chmod=755 uis/start.sh ./uis/start.sh

EXPOSE 3000 3001
ENTRYPOINT ["/sbin/tini", "-g", "--"]
CMD ["bash", "/app/uis/start.sh"]