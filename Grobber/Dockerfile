FROM tiangolo/uwsgi-nginx-flask:python3.6

LABEL maintainer="siku2@outlook.com"

COPY ./requirements.txt ./
RUN pip install -r requirements.txt

COPY ./grobber /app/grobber
COPY ./.docker/uwsgi.ini /app/
COPY ./.docker/grobber.conf /etc/nginx/conf.d/