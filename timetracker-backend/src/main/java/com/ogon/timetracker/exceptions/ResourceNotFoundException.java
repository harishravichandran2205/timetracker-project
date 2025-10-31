package com.ogon.timetracker.exceptions;

public class ResourceNotFoundException extends RuntimeException {
     public ResourceNotFoundException() {
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
