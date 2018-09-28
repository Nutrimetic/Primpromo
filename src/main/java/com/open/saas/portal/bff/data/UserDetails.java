package com.open.saas.portal.bff.data;

import java.util.List;
import java.util.Set;

public class UserDetails {
	private String id;
	private String group;
	private String mail;
	private Set<String> memberUsers;
	private List<String> services;
	private String addOns;
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public Set<String> getMemberUsers() {
		return memberUsers;
	}
	public void setMemberUsers(Set<String> memberUsers) {
		this.memberUsers = memberUsers;
	}
	public String getGroup() {
		return group;
	}
	public void setGroup(String group) {
		this.group = group;
	}
	public String getMail() {
		return mail;
	}
	public void setMail(String mail) {
		this.mail = mail;
	}
	public List<String> getServices() {
		return services;
	}
	public void setServices(List<String> services) {
		this.services = services;
	}
	public String getAddOns() {
		return addOns;
	}
	public void setAddOns(String addOns) {
		this.addOns = addOns;
	}
	
}
