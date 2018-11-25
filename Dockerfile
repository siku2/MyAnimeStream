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
FROM tiangolo/uwsgi-nginx-flask:python3.7

LABEL maintainer="simon@siku2.io"

COPY Pipfile Pipfile.lock ./
RUN pip install pipenv \
    && pipenv install --system --deploy

WORKDIR /app

COPY grobber/grobber grobber
COPY grobber/.docker/uwsgi.ini ./
COPY grobber/.docker/grobber.conf /etc/nginx/conf.d/

COPY --from=dolos /dist/myanimestream.user.js grobber/static/js/