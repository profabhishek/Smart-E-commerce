package com.smartcommerce.backend.order.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class ShippingAddress {

    private String houseNo;
    private String area;
    private String landmark;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String type;    // home / work / other

    // --- Getters and setters ---
    public String getHouseNo() { return houseNo; }
    public void setHouseNo(String houseNo) { this.houseNo = houseNo; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
