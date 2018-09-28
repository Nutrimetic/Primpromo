package com.open.saas.portal.bff.config.ui.composition;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.springframework.boot.json.GsonJsonParser;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.util.UriComponentsBuilder;

import com.netflix.appinfo.InstanceInfo;
import com.netflix.discovery.DiscoveryClient;
import com.open.saas.portal.bff.controller.UserUtils;
import com.open.saas.portal.bff.data.UserDetails;
import com.open.saas.portal.bff.utils.ContextWrapper;

public class ServiceReverseProxyFilter extends GenericFilterBean {
	@Override
	protected void initFilterBean() throws ServletException {
		super.initFilterBean();
	}
	
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest httpServletRequest = (HttpServletRequest)request;
		MultiValueMap<String, String> parameters = UriComponentsBuilder.fromUriString(httpServletRequest.getRequestURI() + "?" + httpServletRequest.getQueryString()).build().getQueryParams();
		List<String> serviceId = parameters.get("service-id");
		List<String> resource = parameters.get("resource");
		List<String> queryString = parameters.get("queryString");
		DiscoveryClient discoveryClient = ContextWrapper.getContext().getBean(DiscoveryClient.class);
		InstanceInfo instance = discoveryClient.getNextServerFromEureka(serviceId.get(0), false);
		UserDetails userDetails = UserUtils.getDetails();
		StringBuilder builder = new StringBuilder("https://").append(instance.getHostName()).append(resource.get(0)).append("?")
													.append("owner=").append(URLEncoder.encode(userDetails.getMail(), StandardCharsets.UTF_8.name())).append("&")
													.append("group=").append(URLEncoder.encode(userDetails.getGroup(), StandardCharsets.UTF_8.name())).append("&")
													.append("adminUser=").append("false");
		try {
			appendQueryString(queryString, builder);
		} catch (Exception e) {
			e.printStackTrace();
		}
		String url = builder.toString();
		HttpClient client = HttpClientBuilder.create().build();
		if ("POST".equalsIgnoreCase(httpServletRequest.getMethod())) {
			HttpPost httpPost = new HttpPost(url);
			httpPost.setHeader("Content-Type",httpServletRequest.getContentType());
			httpPost.setHeader("Accept",httpServletRequest.getHeader("Accept"));
			httpPost.setHeader("Accept-Encoding","gzip,deflate");
			httpPost.setHeader("Content-Encoding","gzip");
			httpPost.setHeader("Authorization", "Bearer " + getBearerToken());
			httpPost.setEntity(new InputStreamEntity(httpServletRequest.getInputStream()));
			HttpResponse httpResponse = client.execute(httpPost);
			copyResponseEntity(httpResponse, (HttpServletResponse)response);
		} else if ("GET".equalsIgnoreCase(httpServletRequest.getMethod())) {
			HttpGet httpGet = new HttpGet(url);
			httpGet.setHeader("Content-Type",httpServletRequest.getContentType());
			httpGet.setHeader("Accept",httpServletRequest.getHeader("Accept"));
			httpGet.setHeader("Accept-Encoding","gzip,deflate");
			httpGet.setHeader("Authorization", "Bearer " + getBearerToken());
			HttpResponse httpResponse = client.execute(httpGet);
			copyResponseEntity(httpResponse, (HttpServletResponse)response);
		}
	}

	private void appendQueryString(List<String> queryString, StringBuilder builder) throws Exception {
		if (queryString!=null && queryString.size()>0) {
			String decoded = URLDecoder.decode(queryString.get(0), StandardCharsets.UTF_8.name());
			String[] parameters = decoded.split("&");
			for(String parameter:parameters) {
				builder.append("&");
				String[] split = parameter.split("=");
				if (split.length >=2) {
					builder.append(split[0]).append("=").append(URLEncoder.encode(split[1], StandardCharsets.UTF_8.name()));
				}
			}
		}
	}
	
	private String getBearerToken() {
        RestTemplate restTemplate = new RestTemplate();     
        MultiValueMap<String, String> form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTID"));
        form.add("client_secret", System.getenv("SECURITY_OAUTH2_CLIENT_CLIENTSECRET"));
        form.add("response_type", "token");
        String response = restTemplate.postForObject(System.getenv("SECURITY_OAUTH2_CLIENT_ACCESSTOKENURI"), form, String.class); 
        GsonJsonParser parser = new GsonJsonParser();
		Map<String, Object> map = parser.parseMap(response);
        return (String) map.get("access_token");
	}

	private void copyResponseEntity(HttpResponse proxyResponse, HttpServletResponse servletResponse) throws IOException {
	   HttpEntity entity = proxyResponse.getEntity();
	   if (entity != null) {
		  ContentType contentType = ContentType.getOrDefault(entity);
		  servletResponse.setContentType(contentType.getMimeType());
	      ServletOutputStream outputStream = servletResponse.getOutputStream();
	      OutputStream servletOutputStream = outputStream;
	      try {
	         entity.writeTo(servletOutputStream);
	      } catch (Exception e) {
	    	  e.printStackTrace();
	      } finally {
	    	  EntityUtils.consume(entity);
	    	  outputStream.flush();
	    	  outputStream.close();
	      }
	   }
	}
}
