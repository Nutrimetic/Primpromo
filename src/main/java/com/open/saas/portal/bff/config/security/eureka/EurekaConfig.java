package com.open.saas.portal.bff.config.security.eureka;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.netflix.discovery.DiscoveryClient.DiscoveryClientOptionalArgs;


@Configuration
public class EurekaConfig {
	@Bean
	public DiscoveryClientOptionalArgs discoveryClientOptionalArgs() {
		DiscoveryClientOptionalArgs discoveryClientOptionalArgs = new DiscoveryClientOptionalArgs();
		discoveryClientOptionalArgs.setAdditionalFilters(Arrays.asList(new EurekaOauth2ClientFilter()));
		return discoveryClientOptionalArgs;
	}
}
