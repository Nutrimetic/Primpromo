package com.open.saas.portal.bff.controller;

import java.io.StringWriter;

import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.Velocity;
import org.apache.velocity.runtime.RuntimeConstants;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.open.saas.portal.bff.PortalApplication;
import com.open.saas.portal.bff.data.Contact;
import com.sendgrid.Content;
import com.sendgrid.Email;
import com.sendgrid.Mail;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;


@RestController
public class ContactController {
	@RequestMapping(path = "/send", method = RequestMethod.POST)
	public void sendMail(@RequestParam(required = false) String lang, @RequestBody final Contact contact) throws Exception {
		Velocity.setProperty(RuntimeConstants.RESOURCE_LOADER, "class");
		Velocity.setProperty("class.resource.loader.class", "org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader");
		Velocity.init();
		VelocityContext velocityContext = new VelocityContext();
		velocityContext.put("contact", contact);
		StringWriter w = new StringWriter();
		String langPath = lang!=null?lang:PortalApplication.DEFAULT_LANG;
		Velocity.mergeTemplate(new StringBuilder("static/template/").append(langPath).append("/mail_template.vm").toString(), "utf-8", velocityContext, w);
		
		Email from = new Email("contact@myprimpromo.com");
		String subject = "Contact MyPrimPromo";
		Email to = new Email("dscontact@open-groupe.com");
		Content content = new Content("text/plain", w.toString());
		Mail mail = new Mail(from, subject, to, content);

		SendGrid sg = new SendGrid(System.getenv("SENDGRID_API_KEY"));
		Request request = new Request();

		request.method = Method.POST;
		request.endpoint = "mail/send";
		request.body = mail.build();
		Response response = sg.api(request);
		System.out.println(response.statusCode);
		System.out.println(response.body);
		System.out.println(response.headers);
	}
}
