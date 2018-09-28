package com.open.saas.portal.bff.controller;

import java.io.StringWriter;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.Velocity;
import org.apache.velocity.runtime.RuntimeConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.open.saas.portal.bff.PortalApplication;
import com.open.saas.portal.bff.data.Feature;
import com.open.saas.portal.bff.data.UserDetails;
import com.sendgrid.Content;
import com.sendgrid.Email;
import com.sendgrid.Mail;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.SendGrid;

@RestController
public class DataMgtController {
	@Autowired
	private CatalogMgtClient catalogMgtClient;
	@Autowired
	private CustomerMgtClient customerMgtClient;
	@Autowired
	private LandMgtClient landMgtClient;
	
	private final Comparator<Feature> productComparator = new Comparator<Feature>() {
		@Override
		public int compare(Feature o1, Feature o2) {
			int order = 0;
			if(o1.getRealeaseOrder()<o2.getRealeaseOrder()) {
				order = -1;
			} else if (o1.getRealeaseOrder()>o2.getRealeaseOrder()) {
				order = 1;
			}
			return order;
		}
	};
	
	@RequestMapping(path = "/solutions", method = RequestMethod.GET)
	List<Feature> getSolutions(@RequestParam Optional<String> lang) throws Exception {
		List<Feature> products = catalogMgtClient.getSolutionList(lang.isPresent()?lang.get():PortalApplication.DEFAULT_LANG);
		Collections.sort(products, productComparator);
		return products;
	}
	
	@RequestMapping(path = "/customers", method = RequestMethod.GET)
	public String getCustomerData() throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		return customerMgtClient.getCustomerData(userDetails.getMail());
	}
	
	@RequestMapping(path = "/customers", method = RequestMethod.POST)
	public void updateUserData(@RequestBody final String customerData) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		customerMgtClient.updateCustomerData(customerData, userDetails.getMail());
	}
	
	@RequestMapping(path = "/subscriptions", method = RequestMethod.POST)
	public void sendStripeForm(@RequestBody String body, @RequestParam String stripeToken) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		customerMgtClient.subscribe(stripeToken, userDetails.getMail(), body);
	}
	
	@RequestMapping(path = "/subscriptions", method = RequestMethod.PUT)
	public void updateSubscriptionPlan(@RequestBody String body) throws Exception {
		customerMgtClient.updateSubscriptionPlan(body);
	}
	
	/*@RequestMapping(path = "/license", method = RequestMethod.POST)
	public void updateLicense(@RequestParam int quantity) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		customerMgtClient.updateLicense(userDetails.getMail(), quantity);
		sendInvoice();
	}*/
	
	@RequestMapping(path = "/products", method = RequestMethod.GET)
    public String getProductList() throws Exception {
        return customerMgtClient.getProducts();
    }
	
	@RequestMapping(path = "/invoices", method = RequestMethod.GET)
    public String getUpcomingInvoice() throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
        return customerMgtClient.getUpcomingInvoice(userDetails.getMail());
    }
	
	@RequestMapping(path = "/lands", method = RequestMethod.GET)
	public String getLandCollection() throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		return landMgtClient.getLands(userDetails.getMail(), userDetails.getGroup());
	}
	
	@RequestMapping(path = "/lands", method = RequestMethod.POST)
	public String updateLand(@RequestBody final String land) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		return landMgtClient.saveLand(land, userDetails.getMail(), userDetails.getGroup());
	}
	
	@RequestMapping(path = "/tenants", method = RequestMethod.POST)
	public String createOrUpdateNewTenant(@RequestBody String tenant) throws Exception {
		return customerMgtClient.createOrUpdateNewTenant(tenant);
	}
	
//	@RequestMapping(path = "/subscriptionData", method = RequestMethod.GET)
//	public String getSubscriptionData(@RequestParam String subscriptionId) throws Exception {
//		return customerMgtClient.getSubscriptionData(subscriptionId);
//	}
	
//	@RequestMapping(path = "/tenant", method = RequestMethod.GET)
//    public String getTenant() throws Exception {
//        UserDetails userDetails = UserUtils.getDetails();
//        return customerMgtClient.getTenant(userDetails.getMail());
//    }
//	
//	@RequestMapping(path = "/tenantQuotations", method = RequestMethod.GET)
//    public String getTenantQuotations() throws Exception {
//        UserDetails userDetails = UserUtils.getDetails();
//        return customerMgtClient.getTenantQuotations(userDetails.getMail());
//    }
	
//	@RequestMapping(path = "/services", method = RequestMethod.GET)
//    public String getServices() throws Exception {
//        return customerMgtClient.getServices();
//    }
	
    private void sendInvoice() throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
        String upcomingInvoice = customerMgtClient.getUpcomingInvoice(userDetails.getMail());
        
        Velocity.setProperty(RuntimeConstants.RESOURCE_LOADER, "class");
		Velocity.setProperty("class.resource.loader.class", "org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader");
		Velocity.init();
		VelocityContext velocityContext = new VelocityContext();
		velocityContext.put("invoice", upcomingInvoice);
		StringWriter w = new StringWriter();
		Velocity.mergeTemplate(new StringBuilder("static/template/fr/").append("mail_template_invoice.vm").toString(), "utf-8", velocityContext, w);
		
		Email from = new Email("contact@myprimpromo.com");
		String subject = "Prochaine facture PPMDS";
		Email to = new Email("christian.dubois@open-groupe.com");
		Content content = new Content("text/plain", w.toString());
		Mail mail = new Mail(from, subject, to, content);

		SendGrid sg = new SendGrid(System.getenv("SENDGRID_API_KEY"));
		Request request = new Request();

		request.method = Method.POST;
		request.endpoint = "mail/send";
		request.body = mail.build();
		sg.api(request);
    }
	
//	@RequestMapping(path = "/isStripeCustomer", method = RequestMethod.GET)
//    public String isStripeCustomer() throws Exception {
//		UserDetails userDetails = UserUtils.getDetails();
//        return customerMgtClient.isStripeCustomer(userDetails.getMail());
//    }
//	
//	@RequestMapping(path = "/isCustomerInMetaData", method = RequestMethod.GET)
//    public Boolean foundCustomerInMetada() throws Exception {
//		UserDetails userDetails = UserUtils.getDetails();
//        return customerMgtClient.findCustomerInMetada(userDetails.getMail());
//    }
//	
//	
//
//	@RequestMapping(path = "/answerQuotation", method = RequestMethod.POST)
//	public void answerQuotation(@RequestBody Map<String, String> params) throws Exception {
//		customerMgtClient.answerQuotation(params.get("quotationId"), params.get("quotationStatus"), params.get("quotationCommercialNotificationStatus"));
//	}
	
//	@RequestMapping(path = "/validateQuotation", method = RequestMethod.POST)
//	public void validateQuotation(@RequestBody String quotationId) throws Exception {
//		customerMgtClient.validateQuotation(quotationId);
//	}
	
//	@RequestMapping(path = "/quotations", method = RequestMethod.POST)
//	public String createOrUpdateQuotation(@RequestBody String quotation) throws Exception {
//		return customerMgtClient.createOrUpdateQuotation(quotation);
//	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	@RequestMapping(path = "/users", method = RequestMethod.POST)
	public void updateSubscriptionUsers(@RequestBody final String configurations, @RequestParam String subscriptionId) throws Exception {
		customerMgtClient.updateSubscriptionUsers(configurations, subscriptionId);
	}
	

	
	// @RequestMapping(path = "/landArchived", method = RequestMethod.POST)
	// public String updateLand(@RequestBody final String land) throws Exception {
	// 	UserDetails userDetails = UserUtils.getDetails();
	// 	return landMgtClient.saveLand(land, userDetails.getMail(), userDetails.getGroup());
	// }
	
	@RequestMapping(path = "/taxes", method = RequestMethod.GET)
	public String getTaxCollection() throws Exception {
			return landMgtClient.getTax();
	}
	
//	@RequestMapping(path = "/descdata", method = RequestMethod.GET)
//	Object[] getDescData(@RequestParam Optional<String> lang, @RequestParam String productId) throws Exception {
//		Object[] descData = new Object[2];
//		List<Feature> products = catalogMgtClient.getSolutionList(lang.isPresent()?lang.get():PortalApplication.DEFAULT_LANG);
//		Feature currentProduct = findProductById(productId, products);
//		String[] relatedProductIds = currentProduct!=null?currentProduct.getRelatedProducts():null;
//		List<Feature> relatedProducts = new ArrayList<Feature>();
//		if (relatedProductIds!=null) {
//			for (String relatedProductId:relatedProductIds) {
//				Feature relatedProduct = findProductById(relatedProductId, products);
//				if (relatedProduct==null) continue;
//				relatedProducts.add(relatedProduct);
//			}
//		}
//		descData[0] = currentProduct;
//		descData[1] = relatedProducts;
//		return descData;
//	}
	
	@RequestMapping(path = "/shares", method = RequestMethod.POST)
	public String shareLand(@RequestBody final String share) throws Exception {
		UserDetails userDetails = UserUtils.getDetails();
		return landMgtClient.updateShare(share, userDetails.getMail(), userDetails.getGroup());
	}
	
	@RequestMapping(path = "/shares", method = RequestMethod.GET)
	public String getSharedWithUsers(@RequestParam String landId) throws Exception {
		return landMgtClient.getSharedWithUsers(landId);
	}
	
	@RequestMapping(path = "/attachments", method = RequestMethod.GET)
	public String getAttachments(@RequestParam String landId) throws Exception {
		return landMgtClient.getAttachments(landId);
	}
	
//	private Feature findProductById(String productId, Collection<Feature> products) {
//		Feature result = null;
//		for (Feature product:products) {
//			if (product.getFeatureId().equals(productId)) {
//				result = product;
//				break;
//			}
//		}
//		return result;
//	}
}