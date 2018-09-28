package com.open.saas.portal.bff;

import java.io.FileInputStream;
import java.io.InputStream;
import java.security.KeyStore;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;

import com.open.saas.portal.bff.html.HtmlResponseFilter;

@SpringBootApplication
@EnableCircuitBreaker
@EnableEurekaClient
public class PortalApplication {
	public static final String DEFAULT_LANG = "fr";
	
	public static void main(String[] args) throws Exception {
		initMongoSSL();
		SpringApplication.run(PortalApplication.class, args);
	}
	
	private static void initMongoSSL() throws Exception {
		// load your key store as a stream and initialize a KeyStore
		InputStream trustStream = Thread.currentThread().getContextClassLoader().getResourceAsStream(System.getenv("CERT_PATH"));
		//InputStream trustStream = new FileInputStream(System.getenv("CERT_PATH"));
		KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());    

		// if your store is password protected then declare it (it can be null however)
		char[] trustPassword = System.getenv("CERT_PWD").toCharArray();

		// load the stream to your store
		trustStore.load(trustStream, trustPassword);

		// initialize a trust manager factory with the trusted store
		TrustManagerFactory trustFactory = 
		  TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());    
		trustFactory.init(trustStore);

		// get the trust managers from the factory
		TrustManager[] trustManagers = trustFactory.getTrustManagers();

		// initialize an ssl context to use these managers and set as default
		SSLContext sslContext = SSLContext.getInstance("SSL");
		sslContext.init(null, trustManagers, null);
		SSLContext.setDefault(sslContext);
	}
	
	@ConditionalOnWebApplication
	@Bean
	public FilterRegistrationBean htmlResponseFilterRegistration() throws Exception {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		HtmlResponseFilter htmlResponseFilter = new HtmlResponseFilter();
		registration.setFilter(htmlResponseFilter);
		registration.addUrlPatterns("/");
		registration.setOrder(0);
		return registration;
	}
}
