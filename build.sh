#!/bin/bash
export SECURITY_OAUTH2_CLIENT_CLIENTID="portal";
export SECURITY_OAUTH2_CLIENT_CLIENTSECRET= $3;
export SECURITY_OAUTH2_CLIENT_SCOPE="portal.user";
export SECURITY_OAUTH2_CLIENT_LOGOUT="https://open-uaa."$1"/logout.do";
export SECURITY_OAUTH2_CLIENT_CHECKTOKENURL="https://open-uaa."$1"/check_token";
export SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI="https://open-uaa."$1"/oauth/token";
export SECURITY_OAUTH2_CLIENT_USERAUTHORIZATIONURI="https://open-uaa."$1"/oauth/authorize";
export SECURITY_OAUTH2_RESOURCE_USERINFOURI="https://open-uaa."$1"/userinfo";
export SECURITY_OAUTH2_RESOURCE_TOKENINFOURI="https://open-uaa."$1"/check_token";
export SECURITY_OAUTH2_SUBSCRIBEURI="https://open-uaa."$1"/create_account";
export SECURITY_OAUTH2_RESOURCE_PREFERTOKENINFO=true;
export SPRING_PROFILES_ACTIVE="cloud";
export SENDGRID_API_KEY=$6;
export CATALOG_MGT_SCOPE="catalog_management.user";
export CUSTOMER_MGT_SCOPE="customer_management.user";
export LAND_MGT_SCOPE="land_management.user";
export CERT_PATH="cert/"$2"/"$4;
export CERT_PWD=$5;
export ATTACHMENT_DB_URL $7;
export ATTACHMENT_DB_USER $8;
export ATTACHMENT_DB_PWD $9;
export LOGGING_LEVEL="DEBUG";
export SERVER_PORT="8085";
mvn clean package
