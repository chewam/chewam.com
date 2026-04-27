FROM nginx:1.29-alpine

# Sert le contenu statique du site (index.html + JSX transpilé in-browser via Babel)
COPY . /usr/share/nginx/html/

# Healthcheck pour k8s liveness/readiness probes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
