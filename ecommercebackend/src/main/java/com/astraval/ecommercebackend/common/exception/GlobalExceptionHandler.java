package com.astraval.ecommercebackend.common.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.astraval.ecommercebackend.common.util.ApiResponse;
import com.astraval.ecommercebackend.common.util.ApiResponseFactory;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ApiResponse<Object>> handleApplicationException(ApplicationException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponseFactory.error(ex.getMessage(), ex.getStatus().value()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> validationErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            validationErrors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
                .body(ApiResponseFactory.validation(validationErrors, "Validation failed"));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> validationErrors = new LinkedHashMap<>();
        ex.getConstraintViolations()
                .forEach(violation -> validationErrors.put(violation.getPropertyPath().toString(), violation.getMessage()));

        return ResponseEntity.badRequest()
                .body(ApiResponseFactory.validation(validationErrors, "Validation failed"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleMalformedJson(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponseFactory.badRequest("Malformed request body"));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponseFactory.error("Method '" + ex.getMethod() + "' is not supported for this endpoint", HttpStatus.METHOD_NOT_ALLOWED.value()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoResourceFound(NoResourceFoundException ex) {
        String message = "No endpoint found for request path: /" + ex.getResourcePath();
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponseFactory.error(message, HttpStatus.NOT_FOUND.value()));
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthorizationDenied(AuthorizationDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponseFactory.error("Access denied", HttpStatus.FORBIDDEN.value()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation", ex);
        String message = "Request violates data constraints";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("foreign key constraint")) {
                message = "Invalid reference: related entity does not exist";
            } else if (ex.getMessage().contains("unique constraint") || ex.getMessage().contains("duplicate")) {
                message = "Duplicate entry: record already exists";
            } else if (ex.getMessage().contains("not-null") || ex.getMessage().contains("NULL")) {
                message = "Required field is missing";
            }
        }
        return ResponseEntity.badRequest()
                .body(ApiResponseFactory.badRequest(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnhandledException(Exception ex) {
        log.error("Unhandled server error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponseFactory.error("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }
}
