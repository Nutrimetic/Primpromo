package com.open.saas.portal.bff.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.open.saas.portal.bff.data.UserDetails;

@RestController
public class PurchaserMgtController {
	@Autowired
	private PurchaserMgtClient purchaserMgtClient;
	
	@RequestMapping(path = "/purchasers", method = RequestMethod.GET)
	String getPurchasers() throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		return purchaserMgtClient.getPurchaser(userDetails.getGroup(), userDetails.getMail());
	}
	
	
	@RequestMapping(path = "/purchasers", method = RequestMethod.POST)
	public String save(@RequestBody final String purchaser) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		return purchaserMgtClient.save(purchaser, userDetails.getGroup(), userDetails.getMail());
	}
	
	@RequestMapping(path = "/purchasers", method = RequestMethod.DELETE)
	public void delete(@RequestParam String id) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		purchaserMgtClient.deletePurchaser(id, userDetails.getGroup(), userDetails.getMail());
	}
	
}