package com.ogon.timetracker.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/options")
public class OptionsController {



    @GetMapping("/categories")
    public List<String> getCategories() {
        // Hardcoded for now
        return List.of("Development", "Testing", "Support");
    }
}
