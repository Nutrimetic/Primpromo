package com.open.saas.portal.bff.data;

public class Feature {
	private String featureId;
	private String lang;
	private String name;
	private String shortDescription;
	private String description;
	private String[] features;
	private String descPage;
	private String descBackground;
	private String screenshot;
	private String icon;
	private String abrv;
	private String color;
	private String uri;
	private String[] relatedProducts;
	private double price;
	private int realeaseOrder;
	private String comment;
		
	public String getFeatureId() {
		return featureId;
	}

	public void setFeatureId(String featureId) {
		this.featureId = featureId;
	}
	
	public String getLang() {
		return lang;
	}

	public void setLang(String lang) {
		this.lang = lang;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getShortDescription() {
		return shortDescription;
	}

	public void setShortDescription(String shortDescription) {
		this.shortDescription = shortDescription;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String[] getFeatures() {
		return features;
	}

	public void setFeatures(String[] features) {
		this.features = features;
	}

	public String getDescPage() {
		return descPage;
	}

	public void setDescPage(String descPage) {
		this.descPage = descPage;
	}
	
	public String getDescBackground() {
		return descBackground;
	}

	public void setDescBackground(String descBackground) {
		this.descBackground = descBackground;
	}

	public String getScreenshot() {
		return screenshot;
	}

	public void setScreenshot(String screenshot) {
		this.screenshot = screenshot;
	}
	
	public String getAbrv() {
		return abrv;
	}

	public void setAbrv(String abrv) {
		this.abrv = abrv;
	}

	public String getIcon() {
		return icon;
	}

	public void setIcon(String icon) {
		this.icon = icon;
	}
	public String getUri() {
		return uri;
	}

	public void setUri(String uri) {
		this.uri = uri;
	}

	public String getColor() {
		return color;
	}

	public void setColor(String color) {
		this.color = color;
	}
	
	public String[] getRelatedProducts() {
		return relatedProducts;
	}

	public void setRelatedProducts(String[] relatedProducts) {
		this.relatedProducts = relatedProducts;
	}

	public double getPrice() {
		return price;
	}

	public void setPrice(double price) {
		this.price = price;
	}

	public int getRealeaseOrder() {
		return realeaseOrder;
	}

	public void setRealeaseOrder(int realeaseOrder) {
		this.realeaseOrder = realeaseOrder;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}
}
