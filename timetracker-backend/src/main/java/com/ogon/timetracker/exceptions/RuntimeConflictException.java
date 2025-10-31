package com.ogon.timetracker.exceptions;

public class RuntimeConflictException extends RuntimeException{

    public RuntimeConflictException(){

    }

    public RuntimeConflictException(String message){
        super(message);
    }
}