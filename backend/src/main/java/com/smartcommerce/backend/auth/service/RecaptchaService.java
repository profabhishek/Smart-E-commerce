package com.smartcommerce.backend.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;

@Service
public class RecaptchaService {

    @Value("${recaptcha.secret}")
    private String recaptchaSecret;

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    public boolean verifyToken(String token) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "secret=" + recaptchaSecret + "&response=" + token;

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        Map response = restTemplate.postForObject(VERIFY_URL, request, Map.class);

        return response != null && Boolean.TRUE.equals(response.get("success"));
    }
}
