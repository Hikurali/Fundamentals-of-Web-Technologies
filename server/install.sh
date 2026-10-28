#!/bin/sh
# Запускать от root из каталога server после загрузки исходников на сервер.
set -eu
cd "$(dirname "$0")"

test -d /var/www/fundamentals/current
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y python3-venv

install -d /opt/obed-api /var/lib/obed-api /var/www/letsencrypt
install -m 644 app.py menu.json requirements.txt /opt/obed-api/
chown www-data:www-data /var/lib/obed-api
chmod 700 /var/lib/obed-api

if [ ! -f /opt/obed-api/venv/bin/python ]; then
    python3 -m venv /opt/obed-api/venv
fi
/opt/obed-api/venv/bin/pip install -r /opt/obed-api/requirements.txt
install -m 644 obed-api.service /etc/systemd/system/obed-api.service

if [ ! -f /etc/nginx/sites-available/fundamentals.before-own-api ]; then
    cp -a /etc/nginx/sites-available/fundamentals /etc/nginx/sites-available/fundamentals.before-own-api
fi
install -m 644 nginx-api.conf /etc/nginx/conf.d/obed-api.conf
install -m 644 nginx-locations.conf /etc/nginx/snippets/obed-locations.conf
install -m 644 nginx-http.conf /etc/nginx/sites-available/fundamentals
systemctl daemon-reload
systemctl enable --now obed-api
systemctl restart obed-api
nginx -t
systemctl reload nginx

if [ ! -f /opt/obed-certbot/bin/certbot ]; then
    python3 -m venv /opt/obed-certbot
fi
/opt/obed-certbot/bin/pip install 'certbot>=5.4,<6'
install -m 755 reload-certificate.sh /usr/local/sbin/obed-reload-certificate
/opt/obed-certbot/bin/certbot certonly --non-interactive --agree-tos \
    --register-unsafely-without-email --preferred-profile shortlived \
    --webroot --webroot-path /var/www/letsencrypt \
    --ip-address 82.23.173.175 --cert-name obed-server \
    --deploy-hook /usr/local/sbin/obed-reload-certificate

install -m 644 nginx-https.conf /etc/nginx/sites-available/fundamentals
nginx -t
systemctl reload nginx
install -m 644 obed-certbot-renew.service obed-certbot-renew.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now obed-certbot-renew.timer
systemctl is-active obed-api
