package com.open.saas.portal.bff.config.security.ssl;
import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.filter.GenericFilterBean;

public class HttpsRedirectFilter extends GenericFilterBean {
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest httpServletRequest = (HttpServletRequest)request;
		if ("http".equals(httpServletRequest.getHeader("$WSSC"))) {
			StringBuffer requestURL = httpServletRequest.getRequestURL();
			HttpServletResponse httpServletResponse = (HttpServletResponse)response;
			httpServletResponse.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
			httpServletResponse.setHeader("Location", requestURL.replace(requestURL.indexOf("http:"), requestURL.indexOf("http:") + "http:".length(), "https:").toString());
		} else {
			chain.doFilter(request, response);
		}
	}
}