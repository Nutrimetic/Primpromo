/**
 * 
 */
package com.open.saas.portal.bff.html;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.util.NestedServletException;

import com.open.saas.portal.bff.PortalApplication;

/**
 * @author CDU13189
 *
 */
public class HtmlResponseFilter extends GenericFilterBean {

	private final static Log logger = LogFactory.getLog(HtmlResponseFilter.class);
	private final ConcurrentHashMap<String, String> templates = new ConcurrentHashMap<String, String>(); 
	
	@Override
	protected void initFilterBean() throws ServletException {
		super.initFilterBean();
		templates.put("fr/index", read("static/template/fr/index.html"));
		templates.put("en/index", read("static/template/en/index.html"));
	}
	
	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		try {
			String requestURI = ((HttpServletRequest)request).getRequestURI();
			HtmlResponseWrapper capturingResponseWrapper = new HtmlResponseWrapper((HttpServletResponse) response);
			chain.doFilter(request, capturingResponseWrapper);
			String lang = request.getParameter("lang");
			String html = renderPage(new StringBuilder(lang!=null?lang:PortalApplication.DEFAULT_LANG).append("/index").toString());
			response.setCharacterEncoding("UTF-8");
			response.setContentType("text/html;charset=utf-8");
			response.setContentLength(html.getBytes("UTF-8").length);
			response.getWriter().write(html);
		} finally {
			response.getWriter().close();
		}
	}
	
	private String renderPage(String templateName) throws ServletException {
		String template = templates.get(templateName);
		StringBuilder htmlBuilder = new StringBuilder(template);
		return htmlBuilder.toString();
	}
	
	private String read(String path) throws ServletException {
		StringBuilder builder = new StringBuilder();
		InputStream in = null;
		BufferedReader br = null;
		try{
			in = getClass().getClassLoader().getResourceAsStream(path);
	        br = new BufferedReader(new InputStreamReader(in, "UTF-8"));
	      	
	        String line;
	        
	        while ((line = br.readLine()) != null) {
	        	builder.append(line);
	     	  } 
		} catch (Exception e) {
			String errormsg = new StringBuilder("Error when reading classpath resource html template: ").append(path).toString();
			logger.error(errormsg, e);
			throw new NestedServletException(errormsg, e);
		} finally {
			try{
				if (in!=null ) in.close();
				if (br!=null ) br.close();
			} 
			catch (Exception e){
				logger.debug("Error when trying to close stream readers", e);
			}
		}
		return builder.toString();
	}
}
