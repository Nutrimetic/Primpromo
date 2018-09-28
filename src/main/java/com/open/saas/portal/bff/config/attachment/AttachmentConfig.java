package com.open.saas.portal.bff.config.attachment;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class AttachmentConfig {
	@Bean
	FilterRegistrationBean attachmentFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		AttachmentResponseFilter attachmentFilter = new AttachmentResponseFilter();
		registration.setFilter(attachmentFilter);
		registration.addUrlPatterns("/attachment/*");
		registration.setOrder(Ordered.LOWEST_PRECEDENCE);
		return registration;
	}
}
