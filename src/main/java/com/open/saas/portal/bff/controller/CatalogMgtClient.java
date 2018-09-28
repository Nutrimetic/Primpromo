package com.open.saas.portal.bff.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.DefaultOAuth2ClientContext;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.client.token.grant.client.ClientCredentialsResourceDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;
import com.open.saas.portal.bff.data.Feature;

@Component
class CatalogMgtClient {
	private static final String CATALOG_MANAGEMENT = "catalog-management";
	private final OAuth2RestTemplate oAuth2RestTemplate;
	private final List<String> catalogScope;
	@Value("${catalog.client.uri}")
	private String catalogClientUri; 
	
	public CatalogMgtClient() {
		catalogScope = Arrays.asList(System.getenv("CATALOG_MGT_SCOPE"));
		oAuth2RestTemplate = getRestTemplate();
	}
	
	@HystrixCommand(fallbackMethod = "getSolutionListFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public List<Feature> getSolutionList(String lang) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(catalogClientUri).path("services").queryParam("search", lang);
        ResponseEntity<String> response;
		try {
			response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
			String featuresJson = response.getBody();
	        ObjectMapper objectMapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
	        Feature[] featureArray = objectMapper.readValue(featuresJson, Feature[].class);
			return Arrays.asList(featureArray);
			
		} catch (Exception e) {
			e.printStackTrace();
		}
        
		return null;
	}

	public List<Feature> getSolutionListFallback(String data) {
		Feature feature = new Feature();
		feature.setFeatureId("calc");
		feature.setName("CALCULATRICE BUDGETAIRE");
		feature.setShortDescription("Estimez un budget global pour votre projet immobilier");
		feature.setDescPage("/description/?lang=fr&productId=calc");
		feature.setScreenshot("screenshot_calc");
		feature.setIcon("icone_calc");
		feature.setUri("/");
		Feature feature1 = new Feature();
		feature1.setFeatureId("budget_simulation");
		feature1.setName("SIMULATION BUDGETAIRE");
		feature1.setShortDescription("Elaborez et simulez  un budget pr�visionnel d�taill� de votre projet immobilier");
		feature1.setDescPage("/description/?lang=fr&productId=budget_simulation");
		feature1.setScreenshot("screenshot_simulation");
		feature1.setIcon("icone_simulation");
		feature1.setUri("/");
		Feature feature2 = new Feature();
		feature2.setFeatureId("market_consultation");
		feature2.setName("CONSULTATION DES MARCHE	");
		feature2.setShortDescription("Suivez vos contrats et factures tout au long des opérations");
		feature2.setDescPage("/description/?lang=fr&productId=market_consultation");
		feature2.setScreenshot("screenshot_consultation");
		feature2.setIcon("icone_consult");
		feature2.setUri("/");
		ArrayList<Feature> features = new ArrayList<Feature>();
		features.add(feature);
		features.add(feature1);
		features.add(feature2);
		return features;
	}

	private OAuth2RestTemplate getRestTemplate() {
		ClientCredentialsResourceDetails resourceDetails = new ClientCredentialsResourceDetails ();
        resourceDetails.setAccessTokenUri(System.getenv("SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI"));
        resourceDetails.setClientId(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTID"));
        resourceDetails.setClientSecret(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTSECRET"));
        resourceDetails.setId(CATALOG_MANAGEMENT);
        resourceDetails.setScope(catalogScope);
        DefaultOAuth2ClientContext clientContext = new DefaultOAuth2ClientContext();
        OAuth2RestTemplate restTemplate = new OAuth2RestTemplate(resourceDetails, clientContext);
        return restTemplate;
	}
}