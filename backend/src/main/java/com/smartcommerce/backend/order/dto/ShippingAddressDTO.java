package com.smartcommerce.backend.order.dto;

import com.smartcommerce.backend.order.entity.ShippingAddress;

public class ShippingAddressDTO {
    private String houseNo;
    private String area;
    private String landmark;
    private String city;
    private String state;
    private String country;
    private String pinCode;

    public ShippingAddressDTO(ShippingAddress address) {
        if (address != null) {
            this.houseNo = address.getHouseNo();
            this.area = address.getArea();
            this.landmark = address.getLandmark();
            this.city = address.getCity();
            this.state = address.getState();
            this.country = address.getCountry();
            this.pinCode = address.getPinCode();
        }
    }

    // getters...
    public String getHouseNo() { return houseNo; }
    public String getArea() { return area; }
    public String getLandmark() { return landmark; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getCountry() { return country; }
    public String getPinCode() { return pinCode; }
}
