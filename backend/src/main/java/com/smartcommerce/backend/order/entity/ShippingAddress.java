package com.smartcommerce.backend.order.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class ShippingAddress {

    private String line1;   // House/Flat, Street, Area
    private String line2;   // Landmark / Apartment
    private String city;
    private String state;
    private String pincode;
    private String type;    // home / work / other

    // --- Getters and setters ---
    public String getLine1() { return line1; }
    public void setLine1(String line1) { this.line1 = line1; }

    public String getLine2() { return line2; }
    public void setLine2(String line2) { this.line2 = line2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
