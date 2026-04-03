package com.yonta.security;

import com.yonta.exception.CustomException;
import com.yonta.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
public class AdminInterceptor implements HandlerInterceptor {

    @Value("${admin.secret-key:yonta-admin-2026}")
    private String adminSecretKey;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }

        boolean classLevel = method.getBeanType().isAnnotationPresent(AdminOnly.class);
        boolean methodLevel = method.hasMethodAnnotation(AdminOnly.class);

        if (!classLevel && !methodLevel) {
            return true;
        }

        String headerKey = request.getHeader("X-Admin-Key");
        if (headerKey == null || !headerKey.equals(adminSecretKey)) {
            log.warn("관리자 인증 실패 - IP: {}, Header: {}", request.getRemoteAddr(), headerKey);
            throw new CustomException(ErrorCode.ADMIN_ACCESS_DENIED);
        }

        log.debug("관리자 인증 성공 - IP: {}", request.getRemoteAddr());
        return true;
    }
}
