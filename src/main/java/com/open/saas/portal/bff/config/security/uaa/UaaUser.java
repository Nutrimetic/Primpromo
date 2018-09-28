package com.open.saas.portal.bff.config.security.uaa;

import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.Assert;

@SuppressWarnings("serial")
public class UaaUser implements UserDetails { 

	private final String id; 

	private final String username; 

	private final String email; 

	private final Set<? extends GrantedAuthority> authorities;

	public UaaUser(String id, String username, String email, Set<? extends GrantedAuthority> authorities) { 
		Assert.hasText(username, "Username cannot be empty"); 
		Assert.hasText(id, "Id cannot be null"); 
		Assert.hasText(email, "Email is required"); 
		this.id = id; 
		this.username = username; 
		this.email = email; 
		this.authorities = authorities;
	} 

	public String getId() { 
		return id; 
	} 

	@Override
	public String getUsername() { 
		return username; 
	} 

	public String getEmail() { 
		return email; 
	} 

	@Override
	public Set<? extends GrantedAuthority> getAuthorities() {
		return authorities;
	}

	@Override
	public String getPassword() {
		return null;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	} 
	
	@Override 
	public String toString() { 
		return "[UaaUser {id=" + id + ", username=" + username + ", email=" + email + "}]"; 
	}

}
