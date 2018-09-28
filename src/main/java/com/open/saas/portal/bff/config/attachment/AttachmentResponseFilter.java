package com.open.saas.portal.bff.config.attachment;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.util.MultiValueMap;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.util.UriComponentsBuilder;

import com.open.saas.portal.bff.controller.UserUtils;
import com.open.saas.portal.bff.data.UserDetails;
import com.open.saas.portal.bff.utils.ContextWrapper;

public class AttachmentResponseFilter extends GenericFilterBean {

	@Override
	public void doFilter(final ServletRequest request, final ServletResponse response, final FilterChain chain) throws IOException, ServletException {
		HttpServletRequest httpServletRequest = (HttpServletRequest)request;
		MultiValueMap<String, String> parameters = UriComponentsBuilder.fromUriString(httpServletRequest.getRequestURI() + "?" + httpServletRequest.getQueryString()).build().getQueryParams();
		List<String> filename = parameters.get("filename");
		List<String> landname = parameters.get("landname");
		try {
			UserDetails userDetails = UserUtils.getDetails();
			HttpServletResponse httpServletResponse = (HttpServletResponse)response;
			httpServletResponse.reset();
			httpServletResponse.setContentType("application/pdf");
			httpServletResponse.setHeader("Content-disposition", new StringBuilder("attachment; filename=").append("\"").append(URLDecoder.decode(filename.get(0), StandardCharsets.UTF_8.name())).append(".pdf").append("\"").toString());
			JdbcTemplate jdbcTemplate = ContextWrapper.getContext().getBean(JdbcTemplate.class);
			StringBuilder queryBuilder = new StringBuilder("SELECT dgd FROM operation WHERE company = UPPER('");
			queryBuilder.append(userDetails.getGroup())
			.append("') AND operation_name = '").append(URLDecoder.decode(landname.get(0), StandardCharsets.UTF_8.name()).replaceAll("'", "''"))
			.append("' AND tranche_code = '").append(URLDecoder.decode(filename.get(0), StandardCharsets.UTF_8.name()))
			.append("' ORDER BY modification_date DESC");
			System.out.println("queryBuilder = " + queryBuilder.toString());
			
			jdbcTemplate.query(queryBuilder.toString(), new ResultSetExtractor<Boolean>() {
				@Override
				public Boolean extractData(ResultSet rs) throws SQLException, DataAccessException {
					try {
						if(rs.next()) {
							OutputStream output = response.getOutputStream();														  
							byte[] bytea= rs.getBytes("dgd");
							output.write(bytea);
						}
					} catch (Exception e) {
						e.printStackTrace();
					}
					return true;
				}
			});
		} finally {
			response.getOutputStream().close();
		}
	}
}
