package com.open.saas.portal.bff.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.boot.json.GsonJsonParser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.provider.OAuth2Authentication;

import com.open.saas.portal.bff.config.security.uaa.UaaUser;
import com.open.saas.portal.bff.data.UserDetails;
import com.open.saas.portal.bff.utils.ContextWrapper;

public final class UserUtils {
	private UserUtils() {}
	
	public static final UserDetails getDetails() {
		UserDetails userDetails = new UserDetails();
		CustomerMgtClient customerMgtClient = ContextWrapper.getContext().getBean(CustomerMgtClient.class);
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if(authentication instanceof OAuth2Authentication) {
			OAuth2Authentication oAuth2Authentication = (OAuth2Authentication)authentication;
			
			Authentication userAuthentication = oAuth2Authentication.getUserAuthentication();
			if(userAuthentication instanceof UsernamePasswordAuthenticationToken) {
				UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =(UsernamePasswordAuthenticationToken)userAuthentication;
				Object principal = usernamePasswordAuthenticationToken.getPrincipal();
				if(principal instanceof UaaUser) {
					UaaUser uaaUser = (UaaUser)principal;
					userDetails.setId(uaaUser.getId());
					userDetails.setMail(uaaUser.getEmail());
					try {
						GsonJsonParser parser = new GsonJsonParser();
						String customerData = customerMgtClient.getCustomerData(uaaUser.getEmail());
						Map<String, Object> parseMap = parser.parseMap(customerData);
						userDetails.setGroup(parseMap.get("company").toString());
						Object subscriptionsObject = parseMap.get("services");
						List<Object> subscriptionList = parser.parseList(subscriptionsObject.toString());
						StringBuilder addOnsStringBuilder = new StringBuilder();
						List<String> services = new ArrayList<String>();
						for (Object subscriptionObject:subscriptionList) {
							String subscriptionJson = subscriptionObject.toString();
							Map<String, Object> subscriptionMap = parser.parseMap(subscriptionJson);
							System.out.println("================================================================================================");
							Object serviceId = subscriptionMap.get("id");
							if(serviceId!=null) services.add(serviceId.toString());
							System.out.println("service id = " + serviceId.toString());
							System.out.println("================================================================================================");
							Object addOnsObject = subscriptionMap.get("addOns");
							if(addOnsObject!=null) {
								List<Object> addOnsList = parser.parseList(addOnsObject.toString());
								int addOnsCount = 0;
								for (Object addOnObject:addOnsList) {
									addOnsStringBuilder.append(addOnObject.toString());
									if(addOnsCount<addOnsList.size()) addOnsStringBuilder.append(",");
									addOnsCount++;
								}
							}
						}
						userDetails.setServices(services);
						System.out.println("================================================================================================");
						System.out.println("addons = " + addOnsStringBuilder.toString());
						System.out.println("================================================================================================");
						userDetails.setAddOns(addOnsStringBuilder.toString());
					} catch (Exception e) {
						e.printStackTrace();
						userDetails.setGroup("");
					}
					userDetails.setMemberUsers(null);
				}
			}
		}
		return userDetails;
	}
}
