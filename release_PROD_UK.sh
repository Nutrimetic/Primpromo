#!/bin/bash
dns="myprimpromo.com";
path="uk/prod";
target="$(cf api|awk -F':' '{if(NR<2)print $3}')";
space="$(cf target|awk -F':' '{if(NR>4)print $2}')";
if [ $target != "//api.eu-gb.bluemix.net" ]; then
    echo "!!! WARNING: YOU MUST BE CONNECTED TO UK !!!";
    exit -1;
fi
if [ $space != "prod" ]; then
    echo "!!! WARNING: PROD VERSION !!!";
    echo "You must be connected to PROD space!";
    exit -1;
fi
#if [ ! -d "src/main/resources/static" ]; then
    mkdir -p src/main/resources/static/js;
    mkdir -p src/main/resources/static/template/fr;
	mkdir -p src/main/resources/static/template/en;
    mkdir -p src/main/resources/static/css;
	mkdir -p src/main/resources/static/img;
#fi
if [ $# -ge 1 ] && [ $1 == "debug" ]; then
    echo "Debug version!";
    \cp -rf src/main/resources/js/index.js src/main/resources/static/js/.
    \cp -rf src/main/resources/template/fr/i18n.js src/main/resources/static/template/fr/.
    \cp -rf src/main/resources/template/fr/index.html src/main/resources/static/template/fr/.
	\cp -rf src/main/resources/template/en/i18n.js src/main/resources/static/template/en/.
    \cp -rf src/main/resources/template/en/index.html src/main/resources/static/template/en/.
    \cp -rf src/main/resources/css/style.css src/main/resources/static/css/.
    \cp -rf src/main/resources/img/*.png src/main/resources/static/img/.
else
    echo "Minified version!";
    uglifyjs --compress --mangle -o src/main/resources/static/js/index.js src/main/resources/js/index.js
    uglifyjs --compress --mangle -o src/main/resources/static/template/fr/i18n.js src/main/resources/template/fr/i18n.js
	uglifyjs --compress --mangle -o src/main/resources/static/template/en/i18n.js src/main/resources/template/en/i18n.js
    htmlmin -o src/main/resources/static/template/fr/index.html src/main/resources/template/fr/index.html
    htmlmin -o src/main/resources/static/template/en/index.html src/main/resources/template/en/index.html
    uglifycss src/main/resources/css/style.css --output src/main/resources/static/css/style.css
    rm -rf src/main/resources/static/img/*.png
    for image in src/main/resources/img/*.png; do
        pngquant --speed 1 $image -o "src/main/resources/static/img/${image##*/}"
    done
fi
./build.sh $dns $path "PortalProd@20170929" "primpromo_truststore.jks" "PrimpromoTrust@250117" "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" "jdbc:postgresql://sl-eu-lon-2-portal.1.dblayer.com:10087/primpromo" "primpromo" "Primpromo@2017";
STATUS=$?
if [ $STATUS -eq 0 ]; then
    ./deploy.sh $dns $path "PortalProd@20170929" "primpromo_truststore.jks" "PrimpromoTrust@250117" "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" "jdbc:postgresql://sl-eu-lon-2-portal.1.dblayer.com:10087/primpromo" "primpromo" "Primpromo@2017";
fi
cf map-route real-estate-service myprimpromo.com --hostname www;
