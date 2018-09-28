package com.open.saas.portal.bff.config.security.uaa;

import java.io.IOException;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.config.annotation.web.configuration.OAuth2ClientConfiguration;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;


@Configuration
@EnableOAuth2Sso
@Controller
public class UaaSsoConfig extends WebSecurityConfigurerAdapter {
	
	@RequestMapping("/user")
	public Map<String, Object> user(Principal user) {
		Map<String, Object> map = new LinkedHashMap<String, Object>();
		map.put("name", user.getName());
		map.put("roles", AuthorityUtils.authorityListToSet(((Authentication) user)
				.getAuthorities()));
		return map;
	}
	
    @RequestMapping(path = "/logout", method = RequestMethod.GET)
    String logout(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws Exception {
    	Cookie cookieWithSlash = new Cookie("JSESSIONID", null);
        cookieWithSlash.setPath(httpServletRequest.getContextPath() + "/"); 
        cookieWithSlash.setMaxAge(0); 
        httpServletResponse.addCookie(cookieWithSlash);
        return new StringBuilder("redirect:").append(System.getenv("SECURITY_OAUTH2_CLIENT_LOGOUT")).toString();
    }
    
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests()
			.antMatchers(HttpMethod.POST, "/send").permitAll()
			.antMatchers("/login","/js/**","/template/**","/css/**","/img/**", "/description/**", "/contact/**","/cgu/**","/cgu_signin/**","/legal_notices/**","/send","/solutions", "/descdata","/subscribe","/wspdata").permitAll()
			.anyRequest()
			.authenticated()
		.and().csrf().csrfTokenRepository(csrfTokenRepository())
		.and().addFilterAfter(csrfHeaderFilter(), CsrfFilter.class)
			.headers()
				.defaultsDisabled()
				.cacheControl()
			.and()
				.httpStrictTransportSecurity()
				.includeSubDomains(true);
	}

	private Filter csrfHeaderFilter() {
		return new OncePerRequestFilter() {
			@Override
			protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
					FilterChain filterChain) throws ServletException, IOException {
				CsrfToken csrf = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
				if (csrf != null) {
					Cookie cookie = WebUtils.getCookie(request, "XSRF-TOKEN");
					String token = csrf.getToken();
					if (cookie == null || token != null && !token.equals(cookie.getValue())) {
						cookie = new Cookie("XSRF-TOKEN", token);
						cookie.setPath("/");
						//cookie.setMaxAge();
						response.addCookie(cookie);
					}
				}
				filterChain.doFilter(request, response);
			}
		};
	}

	private CsrfTokenRepository csrfTokenRepository() {
		HttpSessionCsrfTokenRepository repository = new HttpSessionCsrfTokenRepository();
		repository.setHeaderName("X-XSRF-TOKEN");
		return repository;
	}
	
	@ConditionalOnBean(OAuth2ClientConfiguration.class)
	@ConditionalOnWebApplication
	@Bean
	public FilterRegistrationBean uaaClientFilterRegistration() throws Exception {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		UaaCLientUserDetailsFilter uaaCLientUserDetailsFilter = new UaaCLientUserDetailsFilter();
		registration.setFilter(uaaCLientUserDetailsFilter);	
		registration.addUrlPatterns("/");
		registration.setOrder(100);
		return registration;
	}
}