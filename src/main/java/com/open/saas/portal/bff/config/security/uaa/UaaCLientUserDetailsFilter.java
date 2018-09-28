package com.open.saas.portal.bff.config.security.uaa;
import java.io.IOException;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.boot.json.GsonJsonParser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.jwt.Jwt;
import org.springframework.security.jwt.JwtHelper;
import org.springframework.security.oauth2.common.exceptions.InvalidTokenException;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.OAuth2Request;
import org.springframework.security.oauth2.provider.authentication.OAuth2AuthenticationDetails;
import org.springframework.security.oauth2.provider.client.BaseClientDetails;
import org.springframework.util.Assert;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.util.NestedServletException;


/**
 * Security filter for an OAuth2 client an/or resource application to update user details from token.
 * 
 * @author CDU13189
 *
 */
public class UaaCLientUserDetailsFilter extends GenericFilterBean {
	private final static Log logger = LogFactory.getLog(UaaCLientUserDetailsFilter.class);

	@Override
	public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
		
		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication instanceof OAuth2Authentication) {
				OAuth2Authentication oAuth2Authentication = (OAuth2Authentication)authentication;
				Object details = oAuth2Authentication.getDetails();
				String token = ((OAuth2AuthenticationDetails)details).getTokenValue();
				if (token!=null) {
					Jwt decode = JwtHelper.decode(token);
					GsonJsonParser parser = new GsonJsonParser();
					String claims = decode.getClaims();
					Map<String, Object> map = parser.parseMap(claims);

					if (map.containsKey("error")) {
						logger.debug("check_token returned error: " + map.get("error"));
						throw new InvalidTokenException(claims);
					}

					Assert.state(map.containsKey("client_id"), "Client id must be present in response from auth server");
					String remoteClientId = (String) map.get("client_id");
					
					Set<String> scope = new HashSet<String>();
					
					Set<GrantedAuthority> userAuthorities = new HashSet<GrantedAuthority>();
					if (map.containsKey("scope")) {
						@SuppressWarnings("unchecked")
						Collection<String> values = (Collection<String>) map.get("scope");
						scope.addAll(values);
						userAuthorities.addAll(getAuthorities(values));
					}
					
					
					Set<String> resourceIds = new HashSet<String>();
					if (map.containsKey("aud")) {
						@SuppressWarnings("unchecked")
						Collection<String> values = (Collection<String>) map.get("aud");
						resourceIds.addAll(values);
						
						BaseClientDetails clientDetails = new BaseClientDetails();
						clientDetails.setClientId(remoteClientId);
						clientDetails.setResourceIds(resourceIds);
					}
					
					OAuth2Request clientAuthentication = new OAuth2Request(null, remoteClientId, userAuthorities, true, scope, resourceIds, null, null, null);
					
					String email = (String)map.get("email");
					UaaUser user = new UaaUser((String)map.get("user_id"), (String) map.get("user_name"), email, userAuthorities);
					Authentication userAuthentication = new UsernamePasswordAuthenticationToken(user, null, userAuthorities);
					OAuth2Authentication enhancedAuthentication = new OAuth2Authentication(clientAuthentication, userAuthentication);
					enhancedAuthentication.setDetails(details);
					SecurityContextHolder.getContext().setAuthentication(enhancedAuthentication);
//					CustomerMgtClient customerMgtClient = ContextWrapper.getContext().getBean(CustomerMgtClient.class);
//					customerMgtClient.incCustomerConnectionCount(email);
				}
			}

			chain.doFilter(servletRequest, servletResponse);
		} catch (IOException ex) {
			throw ex;
		} catch (Exception ex) {
				if (ex instanceof ServletException) {
					throw (ServletException) ex;
				}
				if (ex instanceof RuntimeException) {
					throw (RuntimeException) ex;
				}
				throw new NestedServletException("Unhandled exception", ex);

		}
	}
	
	private Set<GrantedAuthority> getAuthorities(Collection<String> authorities) {
		Set<GrantedAuthority> result = new HashSet<GrantedAuthority>();
		for (String authority : authorities) {
			result.add(new SimpleGrantedAuthority(authority));
		}
		return result;
	}
}