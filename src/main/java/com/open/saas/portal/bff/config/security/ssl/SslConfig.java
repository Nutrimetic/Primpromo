package com.open.saas.portal.bff.config.security.ssl;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class SslConfig {
	@Bean
	FilterRegistrationBean sslFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		HttpsRedirectFilter httpsHeaderFilter = new HttpsRedirectFilter();
		registration.setFilter(httpsHeaderFilter);
		registration.addUrlPatterns("/*");
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
		return registration;
	}
}

