package com.open.saas.portal.bff.data;

public class AuthorizedProduct {
	private String productId;

	public String getProductId() {
		return productId;
	}
	public void setProductId(String productId) {
		this.productId = productId;
	}
	
	@Override
	public boolean equals(Object obj) {
		if(obj instanceof Feature) {
			return productId.equals(((Feature)obj).getFeatureId());
		}
		return false;
	}
}
