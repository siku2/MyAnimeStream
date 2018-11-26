# =========
#   dolos
# =========
FROM python:3.7 as dolos
WORKDIR /build

COPY package.json ./
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && npm install

COPY Pipfile ./
RUN pip install pipenv \
    && pipenv install --dev

COPY greaser/ greaser
COPY dolos/ dolos
RUN pipenv run python -m greaser dolos/src /dist

# ===========
#   grobber
# ===========
FROM python:3.7

LABEL maintainer="simon@siku2.io"
EXPOSE 80

# nginx / supervisor
RUN apt-get update \
    && apt-get dist-upgrade -yq \
    && apt-get install -yq nginx supervisor

RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/

RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf \
    && rm /etc/nginx/sites-available/default

# grobber setup
RUN pip install gunicorn uvicorn pipenv

COPY Pipfile Pipfile.lock ./
RUN pipenv install --system --deploy \
    && pipenv run pyppeteer-install

WORKDIR /app

COPY grobber/grobber grobber
COPY grobber/.docker/gunicorn.py ./

COPY grobber/.docker/nginx.conf /etc/nginx/conf.d/
COPY grobber/.docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY --from=dolos /dist/myanimestream.user.js grobber/static/js/

CMD ["/usr/bin/supervisord"]