package com.open.saas.portal.bff.config.ui.composition;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class UICompositionConfig {
	@Bean
	FilterRegistrationBean uiProxyFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		UIReverseProxyFilter uiReverseProxyFilter = new UIReverseProxyFilter();
		registration.setFilter(uiReverseProxyFilter);
		registration.addUrlPatterns("/ui-proxy/*");
		registration.setOrder(Ordered.LOWEST_PRECEDENCE);
		return registration;
	}
	
	@Bean
	FilterRegistrationBean serviceProxyFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		ServiceReverseProxyFilter serviceReverseProxyFilter = new ServiceReverseProxyFilter();
		registration.setFilter(serviceReverseProxyFilter);
		registration.addUrlPatterns("/service-proxy/*");
		registration.setOrder(Ordered.LOWEST_PRECEDENCE);
		return registration;
	}
}
