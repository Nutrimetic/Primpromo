package com.open.saas.portal.bff.config.security.eureka;

import java.util.Map;

import org.springframework.boot.json.GsonJsonParser;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.sun.jersey.api.client.ClientHandlerException;
import com.sun.jersey.api.client.ClientRequest;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.filter.ClientFilter;

/**
 * @author CDU13189
 *
 */
@Component
public class EurekaOauth2ClientFilter extends ClientFilter {
	/* (non-Javadoc)
	 * @see com.sun.jersey.api.client.filter.ClientFilter#handle(com.sun.jersey.api.client.ClientRequest)
	 */
	@Override
	public ClientResponse handle(ClientRequest cr) throws ClientHandlerException {
		if (!cr.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            cr.getHeaders().add(HttpHeaders.AUTHORIZATION, "Bearer " + getBearerToken());
        }
        return getNext().handle(cr);
	}
	
	String getBearerToken() {
        RestTemplate restTemplate = new RestTemplate();     
        MultiValueMap<String, String> form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTID"));
        form.add("client_secret", System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTSECRET"));
        form.add("response_type", "token");
        String response = restTemplate.postForObject(System.getenv("SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI"), form, String.class); 
        GsonJsonParser parser = new GsonJsonParser();
		Map<String, Object> map = parser.parseMap(response);
        return (String) map.get("access_token");
	}
}
