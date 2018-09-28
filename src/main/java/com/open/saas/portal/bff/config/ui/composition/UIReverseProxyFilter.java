package com.open.saas.portal.bff.config.ui.composition;

import java.io.IOException;
import java.io.OutputStream;
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
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.boot.json.GsonJsonParser;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.util.UriComponentsBuilder;

import com.netflix.appinfo.InstanceInfo;
import com.netflix.discovery.DiscoveryClient;
import com.open.saas.portal.bff.PortalApplication;
import com.open.saas.portal.bff.controller.UserUtils;
import com.open.saas.portal.bff.data.UserDetails;
import com.open.saas.portal.bff.utils.ContextWrapper;

public class UIReverseProxyFilter extends GenericFilterBean {
	@Override
	protected void initFilterBean() throws ServletException {
		super.initFilterBean();
	}
	
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		HttpServletRequest httpServletRequest = (HttpServletRequest)request;
		MultiValueMap<String, String> parameters = UriComponentsBuilder.fromUriString(httpServletRequest.getRequestURI() + "?" + httpServletRequest.getQueryString()).build().getQueryParams();
		List<String> serviceId = parameters.get("service-id");
		List<String> resource = parameters.get("resource");
		List<String> lang = parameters.get("lang");
		String service = serviceId.get(0);
		UserDetails userDetails = UserUtils.getDetails();
//		if (userDetails.getServices().contains(service)) {
			System.out.println("================================================================================================");
			System.out.println(" userDetails.getServices() contains " + service);
			System.out.println("================================================================================================");
			DiscoveryClient discoveryClient = ContextWrapper.getContext().getBean(DiscoveryClient.class);
			InstanceInfo instance = discoveryClient.getNextServerFromEureka(service, false);
			String url = new StringBuilder("https://").append(instance.getHostName()).append(resource.get(0)).append("?lang=").append(lang!=null?lang.get(0):PortalApplication.DEFAULT_LANG).append("&")
					.append("addOns=").append(URLEncoder.encode(userDetails.getAddOns(), StandardCharsets.UTF_8.name())).toString();
			
			HttpClient client = HttpClientBuilder.create().build();
			HttpGet httpGet = new HttpGet(url);
			String contentype = getContentype(resource.get(0));
			httpGet.setHeader("Content-Type",contentype);
			httpGet.setHeader("Authorization", "Bearer " + getBearerToken());
			HttpResponse httpResponse = client.execute(httpGet);
			copyResponseEntity(httpResponse, (HttpServletResponse)response, contentype);
		/*} else {
			System.out.println("================================================================================================");
			System.out.println(" userDetails.getServices() does not contain " + service);
			System.out.println("================================================================================================");
		}*/
	}
	
	private String getContentype(String resource) {
		String contentType = "text/plain;charset=UTF-8";
		if(resource.contains(".js")) {
			contentType = "text/javascript";
		} else if (resource.contains(".css")) {
			contentType = "text/css";
		} 
		return contentType;
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

	private void copyResponseEntity(HttpResponse proxyResponse, HttpServletResponse servletResponse, String contentype) throws IOException {
	   HttpEntity entity = proxyResponse.getEntity();
	   if (entity != null) {
		  servletResponse.setContentType(contentype);
	      ServletOutputStream outputStream = servletResponse.getOutputStream();
	      OutputStream servletOutputStream = outputStream;
	      try {
	         entity.writeTo(servletOutputStream);
	      } catch (Exception e) {
	    	  e.printStackTrace();
	      } finally {
	    	  outputStream.close();
	      }
	   }
	}
}
