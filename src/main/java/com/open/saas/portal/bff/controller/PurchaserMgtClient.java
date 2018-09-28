package com.open.saas.portal.bff.controller;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.DefaultOAuth2ClientContext;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.client.token.grant.client.ClientCredentialsResourceDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;


@Component
public class PurchaserMgtClient {
	private static final String PURCHASER_MANAGEMENT = "purchaser-management";
	private final OAuth2RestTemplate oAuth2RestTemplate;
	private final List<String> purchaserScope;
	@Value("${purchaser.client.uri}")
	private String purchaserClientUri;
	
	public PurchaserMgtClient() {
		purchaserScope = Arrays.asList(System.getenv("PURCHASER_MGT_SCOPE"));
		oAuth2RestTemplate = getRestTemplate();
	}
//	
//	@HystrixCommand(fallbackMethod = "getPurchaserFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
	public String getPurchaser(String group, String owner) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(purchaserClientUri).path("purchasers")
																					.queryParam("group", group)
																					.queryParam("owner",owner);
        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
        return response.getBody();
	}

//	public String getPurchaserFallback(String group, String owner) {
//		return "{}";
//	}																													  
	
//	@HystrixCommand(fallbackMethod = "saveFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
	public String save(String purchaser, String group, String owner) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(purchaserClientUri).path("purchasers")
															.queryParam("group", group)
															.queryParam("owner",owner);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
		headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON_UTF8));
		HttpEntity<String> entity = new HttpEntity<String>(purchaser,headers);
		String response = oAuth2RestTemplate.postForObject(builder.build().encode().toUri(), entity, String.class);
		System.out.println(" !!!!!!!!!!!!!!!! response !!!!!!!!!!!!! " + response);
        return response;
	}

//	public String saveFallback(String purchaser, String group, String owner) {
//		System.out.println("!!!!!! PURCHASER FALLBACK !!!!!!!");
//		return "{}";
//	}
	
//	@HystrixCommand(fallbackMethod = "deletePurchaserFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
	public void deletePurchaser(String id, String group, String owner) throws Exception {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(purchaserClientUri).path("purchasers")
        													.queryParam("id", id)
        													.queryParam("group", group)
															.queryParam("owner",owner);
        oAuth2RestTemplate.delete(builder.build().encode().toUri());
	}

//	public void deletePurchaserFallback(String purchaser) {
//		System.out.println("!!!!!! PURCHASER FALLBACK !!!!!!!");
//	}
	
	private OAuth2RestTemplate getRestTemplate() {
		ClientCredentialsResourceDetails resourceDetails = new ClientCredentialsResourceDetails ();
        resourceDetails.setAccessTokenUri(System.getenv("SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI"));
        resourceDetails.setClientId(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTID"));
        resourceDetails.setClientSecret(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTSECRET"));
        resourceDetails.setId(PURCHASER_MANAGEMENT);
        resourceDetails.setScope(purchaserScope);
        DefaultOAuth2ClientContext clientContext = new DefaultOAuth2ClientContext();
        OAuth2RestTemplate restTemplate = new OAuth2RestTemplate(resourceDetails, clientContext);
        return restTemplate;
	}

}