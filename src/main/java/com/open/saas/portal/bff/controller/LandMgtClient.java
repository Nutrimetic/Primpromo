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
class LandMgtClient {
	private static final String LAND_MANAGEMENT = "land-management";
	private final OAuth2RestTemplate oAuth2RestTemplate;
	private final List<String> landScope;
	@Value("${land.client.uri}")
	private String landClientUri;
	
	public LandMgtClient() {
		landScope = Arrays.asList(System.getenv("LAND_MGT_SCOPE"));
		oAuth2RestTemplate = getRestTemplate();
	}
	
	@HystrixCommand(fallbackMethod = "getLandsFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getLands(String owner, String group) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(landClientUri).path("land")
															.queryParam("owner",owner)
															.queryParam("group", group);
        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
        return response.getBody();
	}

	public String getLandsFallback(String owner, String group) {
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "getTaxFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getTax() throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(landClientUri).path("tax");
        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
        return response.getBody();
	}

	public String getTaxFallback() {
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "saveLandFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String saveLand(String land, String owner, String group) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(landClientUri).path("land")
															.queryParam("owner",owner)
															.queryParam("group", group);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
		headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON_UTF8));
		HttpEntity<String> entity = new HttpEntity<String>(land,headers);
		String response = oAuth2RestTemplate.postForObject(builder.build().encode().toUri(), entity, String.class);
        return response;
	}

	public String saveLandFallback(String land, String owner, String group) {
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "updateShareFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String updateShare(String share, String owner, String group) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(landClientUri).path("share")
															.queryParam("group", group)
															.queryParam("owner",owner);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
		HttpEntity<String> entity = new HttpEntity<String>(share,headers);
		String response = oAuth2RestTemplate.postForObject(builder.build().encode().toUri(), entity, String.class);
		return response;
	}
	
	public String updateShareFallback(String share, String owner, String group) {
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "getSharedWithUsersFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getSharedWithUsers(String landId) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(landClientUri).path("sharedwith")
															.queryParam("landId", landId);
		ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
		String body = response.getBody();
		System.out.println("******************************************************************************");
		System.out.println("response.getBody() = " + response.getBody());
		System.out.println("******************************************************************************");
		return body;
	}
	
	public String getSharedWithUsersFallback(String landId) {
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "getAttachmentsFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getAttachments(String landId) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(landClientUri).path("attachment")
															.queryParam("landId", landId);
		ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
		String body = response.getBody();
		System.out.println("******************************************************************************");
		System.out.println("response.getBody() = " + response.getBody());
		System.out.println("******************************************************************************");
		return body;
	}
	
	public String getAttachmentsFallback(String landId) {
		return "{}";
	}
	
	private OAuth2RestTemplate getRestTemplate() {
		ClientCredentialsResourceDetails resourceDetails = new ClientCredentialsResourceDetails ();
        resourceDetails.setAccessTokenUri(System.getenv("SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI"));
        resourceDetails.setClientId(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTID"));
        resourceDetails.setClientSecret(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTSECRET"));
        resourceDetails.setId(LAND_MANAGEMENT);
        resourceDetails.setScope(landScope);
        DefaultOAuth2ClientContext clientContext = new DefaultOAuth2ClientContext();
        OAuth2RestTemplate restTemplate = new OAuth2RestTemplate(resourceDetails, clientContext);
        return restTemplate;
	}
}