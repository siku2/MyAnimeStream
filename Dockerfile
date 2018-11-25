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

RUN apt-get update \
    && apt-get install -y nginx supervisor

RUN rm /etc/nginx/sites-available/default

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

COPY grobber/.docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

CMD ["/usr/bin/supervisord"]