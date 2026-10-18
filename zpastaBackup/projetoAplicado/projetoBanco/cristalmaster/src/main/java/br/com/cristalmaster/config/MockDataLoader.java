package br.com.cristalmaster.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import br.com.cristalmaster.models.Lote;
import br.com.cristalmaster.repositories.LoteRepository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Carrega o dados-mock.json (classpath) na tabela "lote" na primeira execução,
 * apenas se a tabela estiver vazia.
 *
 * Observação: o Spring Boot 4 usa Jackson 3 (pacote tools.jackson), não mais com.fasterxml.
 */
@Component
public class MockDataLoader implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(MockDataLoader.class);

	private final LoteRepository repository;

	public MockDataLoader(LoteRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(String... args) throws IOException {
		if (repository.count() > 0) {
			log.info("Tabela lote já possui dados; mock não será carregado.");
			return;
		}
		JsonMapper mapper = JsonMapper.builder().build();
		try (InputStream in = new ClassPathResource("dados-mock.json").getInputStream()) {
			Lote[] lotes = mapper.readValue(in, Lote[].class);
			repository.saveAll(Arrays.asList(lotes));
			log.info("Mock carregado: {} lotes.", lotes.length);
		}
	}
}
