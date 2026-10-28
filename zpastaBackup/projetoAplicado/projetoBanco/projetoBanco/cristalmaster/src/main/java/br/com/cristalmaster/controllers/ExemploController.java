package br.com.cristalmaster.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExemploController {

    @GetMapping("/api/exemplo")
    public String exemplo() {
        return "API CristalMaster funcionando!";
    }
}
