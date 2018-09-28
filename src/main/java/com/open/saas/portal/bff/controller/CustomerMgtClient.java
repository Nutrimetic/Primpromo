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
public class CustomerMgtClient {
	private static final String CUSTOMER_MANAGEMENT = "customer-management";
	private final OAuth2RestTemplate oAuth2RestTemplate;
	private final List<String> customerScope;
	@Value("${customer.client.uri}")
	private String customerClientUri;
	
	public CustomerMgtClient() {
		customerScope = Arrays.asList(System.getenv("CUSTOMER_MGT_SCOPE"));
		oAuth2RestTemplate = getRestTemplate();
	}
	
	@HystrixCommand(fallbackMethod = "getCustomerDataFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getCustomerData(String email) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("customers").queryParam("mail", email);
        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
        return response.getBody();
	}

	public String getCustomerDataFallback(String email) {
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "updateCustomerDataFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public void updateCustomerData(String customerData, String email) throws Exception {       
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("customers").queryParam("mail", email);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        HttpEntity<String> entity = new HttpEntity<String>(customerData, headers);
  		oAuth2RestTemplate.postForEntity(builder.build().encode().toUri(), entity, String.class);
	}

	public void updateCustomerDataFallback(String customerData, String email) {
		System.out.println("!!!!!! CUSTOMER FALLBACK !!!!!!!");
	}
	
	@HystrixCommand(fallbackMethod = "getUpcomingInvoiceFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getUpcomingInvoice(String mail) throws Exception {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("invoices").queryParam("mail", mail);
        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
        return response.getBody();
	}

	public String getUpcomingInvoiceFallback(String mail) {
		return "{}";
	}
	
//	@HystrixCommand(fallbackMethod = "isStripeCustomerFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
//	public String isStripeCustomer(String mail) throws Exception {
//		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("isStripeCustomer").queryParam("mail", mail);
//        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
//        return response.getBody();
//	}
//	
//	public String isStripeCustomerFallback(String mail) {
//		return "{}";
//	}
//	
//	@HystrixCommand(fallbackMethod = "findCustomerInMetadaFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
//	public Boolean findCustomerInMetada(String mail) throws Exception {
//		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("isCustomerInMetaData").queryParam("mail", mail);
//        ResponseEntity<Boolean> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, Boolean.class);
//        return response.getBody();
//	}
//
//	public Boolean  findCustomerInMetadaFallback(String mail) {
//		return false;
//	}
	
	@HystrixCommand(fallbackMethod = "createOrUpdateNewTenantFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String createOrUpdateNewTenant(String tenant) throws Exception {       
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("tenants");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        HttpEntity<String> entity = new HttpEntity<String>(tenant, headers);
        return oAuth2RestTemplate.postForEntity(builder.build().encode().toUri(), entity, String.class).getBody();
	}

	public String createOrUpdateNewTenantFallback(String tenant) {
		System.out.println("!!!!!! NEW TENANT FALLBACK !!!!!!!");
		return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "updateSubscriptionPlanFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public void updateSubscriptionPlan(String body) throws Exception {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("subscriptions");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        HttpEntity<String> entity = new HttpEntity<String>(body, headers);
        oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.PUT, entity, String.class);
	}

	public void updateSubscriptionPlanFallback(String body) {
		System.out.println("!!!!!! UPDATE SUBSCRIPTION PLAN FALLBACK !!!!!!!");
	}
	
	@HystrixCommand(fallbackMethod = "updateLicenseFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public void updateLicense(String mail, int quantity) throws Exception {       
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("license").queryParam("mail", mail).queryParam("quantity", quantity);
        oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.POST, null, String.class);
	}

	public void updateLicenseFallback(String subscriptionId, int quantity) {
		System.out.println("!!!!!! UPDATE LICENSE FALLBACK !!!!!!!");
	}
	
	@HystrixCommand(fallbackMethod = "updateSubscriptionUsersFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public void updateSubscriptionUsers(String configurations, String subscriptionId) throws Exception {       
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("users").queryParam("subscriptionId", subscriptionId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        HttpEntity<String> entity = new HttpEntity<String>(configurations, headers);
  		oAuth2RestTemplate.postForEntity(builder.build().encode().toUri(), entity, String.class);
	}

	public void updateSubscriptionUsersFallback(String configurations, String subscriptionId) {
		System.out.println("!!!!!! CONFIGURE SUBSCRIPTION USERS FALLBACK !!!!!!!");
	}
	
	@HystrixCommand(fallbackMethod = "getTenantFallback",
	           commandProperties = {
	                   @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
	                   /*,
	                   @HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
	           })
	public String getTenant(String email) throws Exception {
		   UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("tenant").queryParam("mail", email);
		   ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
		   return response.getBody();
	}
	
	public String getTenantFallback(String email) {
	    return "{}";
	}
	
	@HystrixCommand(fallbackMethod = "getProductsFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getProducts() {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("products");
        ResponseEntity<String> response;
        String body = "[]";
		try {
			response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
			body = response.getBody();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return body;
//		BasicProduct product = new BasicProduct();
//		product.setProductId("001");
//		product.setName("Basic");
//		product.setActivedMeteredPrice(9);
//		product.setLicensedPrice(19);
//		product.setPerSeatCount(1);
//		ArrayList<Feature2> features = new ArrayList<Feature2>();
//		Feature2 feature = new Feature2();
//		ArrayList<String> featureItems = new ArrayList<String>();
//		feature.setTitle("Bilan Promoteur");
//		featureItems.add("Evaluation de la valeur vénale et du terrain");
//		featureItems.add("Modélisation des recettes");
//		featureItems.add("Modélisation des dépenses");
//		featureItems.add("Evaluation des risques d'assainissement");
//		featureItems.add("Calcul de rendements");
//		feature.setFeatureItems(featureItems);
//		features.add(feature);
//		product.setFeatures(features);
//		product.setFreeTrial(true);
//		product.setFreeTrialDuration(30);
//		
//		ExtendedFullProduct product1 = new ExtendedFullProduct();
//		product1.setProductId("002");
//		product1.setName("Standard");
//		product1.setActivedMeteredPrice(99);
//		product1.setArchivedMeteredPrice(19);
//		product1.setLicensedPrice(19);
//		product1.setPerSeatCount(1);
//		ArrayList<Feature2> features1 = new ArrayList<Feature2>();
//		Feature2 feature1 = new Feature2();
//		ArrayList<String> featureItems1 = new ArrayList<String>();
//		feature1.setTitle("Bilan Promoteur");
//		featureItems1.add("Evaluation de la valeur vénale et du terrain");
//		featureItems1.add("Modélisation des recettes");
//		featureItems1.add("Modélisation des dépenses");
//		featureItems1.add("Evaluation des risques d'assainissement");
//		featureItems1.add("Calcul de rendements");
//		Feature2 feature12 = new Feature2();
//		ArrayList<String> featureItems12 = new ArrayList<String>();
//		feature12.setTitle("Grille de Prix");
//		featureItems12.add("Modélisation des lots et annexes");
//		featureItems12.add("Suivi de commercialisation");
//		feature1.setFeatureItems(featureItems1);
//		features1.add(feature1);
//		feature12.setFeatureItems(featureItems12);
//		features1.add(feature12);
//		product1.setFeatures(features1);
//		product1.setHighlighted(true);
//		
//		ExtendedFullProduct product2 = new ExtendedFullProduct();
//		product2.setProductId("003");
//		product2.setName("Full");
//		product2.setActivedMeteredPrice(199);
//		product2.setArchivedMeteredPrice(59);
//		product2.setLicensedPrice(19);
//		product2.setPerSeatCount(1);
//		ArrayList<Feature2> features2 = new ArrayList<Feature2>();
//		Feature2 feature2 = new Feature2();
//		ArrayList<String> featureItems2 = new ArrayList<String>();
//		feature2.setTitle("Bilan Promoteur");
//		featureItems2.add("Evaluation de la valeur vénale et du terrain");
//		featureItems2.add("Modélisation des recettes");
//		featureItems2.add("Modélisation des dépenses");
//		featureItems2.add("Evaluation des risques d'assainissement");
//		featureItems2.add("Calcul de rendements");
//		feature2.setFeatureItems(featureItems2);
//		features2.add(feature2);
//		product2.setFeatures(features2);
//		ArrayList<BasicProduct> products = new ArrayList<BasicProduct>();
//		products.add(product);
//		products.add(product1);
//		products.add(product2);
//		return products;
	}

	public String getProductsFallback() {
		return "[]";
	}
	
	
//	@HystrixCommand(fallbackMethod = "getServicesFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
//	public String getServices() {
//		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("services");
//        ResponseEntity<String> response;
//        String body = "[]";
//		try {
//			response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
//			body = response.getBody();
//		} catch (Exception e) {
//			e.printStackTrace();
//		}
//		return body;
//	}
//
//	public String getServicesFallback() {
//		return "[]";
//	}
	
	@HystrixCommand(fallbackMethod = "getServicesFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String getServices(String subscriptionId) {
		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("services").queryParam("subscriptionId", subscriptionId);
		ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
	    return response.getBody();
	}

	public String getServicesFallback(String subscriptionId) {
		return "[]";
	}
	
	@HystrixCommand(fallbackMethod = "getTenantQuotationsFallback",
	           commandProperties = {
	                   @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
	                   /*,
	                   @HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
	           })
    public String getTenantQuotations(String email) throws Exception {
	    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("tenantQuotations").queryParam("mail", email);
	    ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
	    return response.getBody();
    }

    public String getTenantQuotationsFallback(String email) {
        return "[]";
    }
	
	@HystrixCommand(fallbackMethod = "answerQuotationFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public void answerQuotation(String quotationId, String quotationStatus, String quotationCommercialNotificationStatus) throws Exception {       
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("answerQuotation").queryParam("quotationId", quotationId).queryParam("quotationStatus", quotationStatus).queryParam("quotationCommercialNotificationStatus", quotationCommercialNotificationStatus);
        oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.POST, null, String.class);
	}

	public void answerQuotationFallback(String quotationId, String quotationStatus, String quotationCommercialNotificationStatus) {
		
	}
	
	@HystrixCommand(fallbackMethod = "subscribeFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String subscribe(String stripeToken, String email, String body) throws Exception {  
		System.out.println("!!! Call /subscribe CUSTOMER SIDE !!!");
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("subscriptions").queryParam("stripeToken", stripeToken).queryParam("stripeEmail", email);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        HttpEntity<String> entity = new HttpEntity<String>(body, headers);
  		return oAuth2RestTemplate.postForEntity(builder.build().encode().toUri(), entity, String.class).getBody();
	}

	public String subscribeFallback(String stripeToken, String email, String body) {
		return "";
	}
	
	
//	@HystrixCommand(fallbackMethod = "incCustomerConnectionCountFallback",
//            commandProperties = {
//            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
//            		/*,
//            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
//            })
//	public String incCustomerConnectionCount(String email) throws Exception {
//		UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("inc_connection").queryParam("mail", email);
//        ResponseEntity<String> response = oAuth2RestTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET, null, String.class);
//        return response.getBody();
//	}
//
//	public String incCustomerConnectionCountFallback(String email) {
//		return "1";
//	}
	
	@HystrixCommand(fallbackMethod = "createOrUpdateQuotationFallback",
            commandProperties = {
            		@HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "100000")
            		/*,
            		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")*/
            })
	public String createOrUpdateQuotation(String quotation) throws Exception {       
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(customerClientUri).path("quotations");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        HttpEntity<String> entity = new HttpEntity<String>(quotation, headers);
  		return oAuth2RestTemplate.postForEntity(builder.build().encode().toUri(), entity, String.class).getBody();
	}

	public String createOrUpdateQuotationFallback(String quotation) {
		return "{}";
	}
	

	private OAuth2RestTemplate getRestTemplate() {
		ClientCredentialsResourceDetails resourceDetails = new ClientCredentialsResourceDetails ();
        resourceDetails.setAccessTokenUri(System.getenv("SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI"));
        resourceDetails.setClientId(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTID"));
        resourceDetails.setClientSecret(System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTSECRET"));
        resourceDetails.setId(CUSTOMER_MANAGEMENT);
        resourceDetails.setScope(customerScope);
        DefaultOAuth2ClientContext clientContext = new DefaultOAuth2ClientContext();
        OAuth2RestTemplate restTemplate = new OAuth2RestTemplate(resourceDetails, clientContext);
        return restTemplate;
	}
}