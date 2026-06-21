rm app_data/ghost/themes/ciyanea -r
cp -r ciyanea app_data/ghost/themes/
rm -r app_data/ghost/themes/ciyanea/test
docker restart ghost