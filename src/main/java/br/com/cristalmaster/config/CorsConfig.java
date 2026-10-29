package br.com.cristalmaster.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Libera o CORS para a tela rodando em outra origem durante o desenvolvimento
 * (Live Server na 5500, Vite na 5173, React na 3000, etc.).
 *
 * Quando a tela é aberta em http://localhost:8080/ (servida pelo próprio Spring),
 * a origem é a mesma e o navegador nem aplica CORS; esta classe cobre os outros casos.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Qualquer porta do próprio computador. allowedOriginPatterns aceita o curinga na porta.
                .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600); // o navegador guarda a resposta do preflight (OPTIONS) por 1 hora
    }
}
