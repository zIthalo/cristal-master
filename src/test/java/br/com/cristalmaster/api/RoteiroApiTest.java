package br.com.cristalmaster.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * Reproduz o roteiro do README ("Simulando o uso real") pela API, com banco H2 em memória.
 * Cada teste começa com os 5 lotes de demonstração e desfaz tudo no fim (@Transactional).
 * As datas são relativas a hoje, então o teste não "envelhece".
 *
 * Rodar: .\mvnw.cmd test
 */
@SpringBootTest
@Transactional
class RoteiroApiTest {

    private record Resp(int status, String corpo) { }

    @Autowired
    private WebApplicationContext contexto;

    private MockMvc mvc;

    @BeforeEach
    void preparar() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(contexto).build();
        // Mesmos 5 lotes do docs/carregar-demo.ps1, com datas relativas a hoje.
        lote("LOT201", "Resina Cristal", "F01", 1000, -100, 300);
        lote("LOT202", "Resina Cristal", "F02", 800, -70, 330);
        lote("LOT203", "Aditivo Azul", "F03", 500, -130, -1);   // já vencido
        lote("LOT204", "Aditivo Azul", "F04", 400, -60, 120);
        lote("LOT205", "Aditivo Vermelho", "F05", 300, -50, 150);
    }

    // ---------- auxiliares ----------

    private Resp enviar(RequestBuilder req) throws Exception {
        var r = mvc.perform(req).andReturn().getResponse();
        return new Resp(r.getStatus(), r.getContentAsString(StandardCharsets.UTF_8));
    }

    private Resp postJson(String url, String json) throws Exception {
        return enviar(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Resp getUrl(String url) throws Exception {
        return enviar(get(url));
    }

    private Resp lote(String codigo, String produto, String fileira, int qtd, int diasEntrada, int diasValidade) throws Exception {
        LocalDate hoje = LocalDate.now();
        String json = "{\"codigoQr\":\"" + codigo + "\",\"produto\":\"" + produto + "\",\"fileira\":\"" + fileira
                + "\",\"quantidade\":" + qtd + ",\"dataEntrada\":\"" + hoje.plusDays(diasEntrada)
                + "\",\"validade\":\"" + hoje.plusDays(diasValidade) + "\"}";
        return postJson("/api/lotes", json);
    }

    private Resp saida(String codigo, int qtd) throws Exception {
        return postJson("/api/saidas", "{\"codigoQr\":\"" + codigo + "\",\"quantidade\":" + qtd + "}");
    }

    // ---------- testes ----------

    @Test
    void healthResponde200() throws Exception {
        Resp r = getUrl("/health");
        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("Sistema OK"), r.corpo());
    }

    @Test
    void cadastroDeLoteRetorna201() throws Exception {
        assertEquals(201, lote("LOT300", "Teste", "F30", 10, 0, 30).status());
    }

    @Test
    void proximosMostraUmLotePorProdutoSemOVencido() throws Exception {
        Resp r = getUrl("/api/fifo/proximos");
        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("LOT201"), r.corpo());
        assertTrue(r.corpo().contains("LOT204"), r.corpo());
        assertTrue(r.corpo().contains("LOT205"), r.corpo());
        assertFalse(r.corpo().contains("LOT202"), "LOT202 ainda não é o próximo da Resina");
        assertFalse(r.corpo().contains("LOT203"), "LOT203 está vencido");
    }

    @Test
    void passo1_saidaCorretaBaixaOSaldo() throws Exception {
        Resp r = saida("LOT201", 200);
        assertEquals(200, r.status(), r.corpo());
        assertTrue(r.corpo().contains("\"saldoAtual\":800"), r.corpo());
        assertTrue(r.corpo().contains("FIFO OK"), r.corpo());
    }

    @Test
    void passo2_foraDoFifoEBloqueado() throws Exception {
        Resp r = saida("LOT202", 100);
        assertEquals(400, r.status(), r.corpo());
        assertTrue(r.corpo().contains("FIFO violado"), r.corpo());
        assertTrue(r.corpo().contains("LOT201"), r.corpo());
    }

    @Test
    void passo3_loteVencidoEBloqueado() throws Exception {
        Resp r = saida("LOT203", 50);
        assertEquals(400, r.status(), r.corpo());
        assertTrue(r.corpo().contains("Lote vencido"), r.corpo());
    }

    @Test
    void passo4_quantidadeAcimaDoSaldoEBloqueada() throws Exception {
        Resp r = saida("LOT201", 5000);
        assertEquals(400, r.status(), r.corpo());
        assertTrue(r.corpo().contains("acima do saldo"), r.corpo());
    }

    @Test
    void passo5_loteInexistenteRetorna404() throws Exception {
        Resp r = saida("LOT999", 10);
        assertEquals(404, r.status(), r.corpo());
        assertTrue(r.corpo().contains("LOT999"), r.corpo());
    }

    @Test
    void passos6e7_outrosProdutosSaemNormalmente() throws Exception {
        assertEquals(200, saida("LOT204", 100).status());          // Azul: o próximo é o LOT204
        Resp r = saida("LOT205", 300);                              // Vermelho: esgota o lote
        assertEquals(200, r.status(), r.corpo());
        assertTrue(r.corpo().contains("\"saldoAtual\":0"), r.corpo());
        assertFalse(getUrl("/api/fifo/proximos").corpo().contains("LOT205"), "lote esgotado não é mais o próximo");
    }

    @Test
    void passos8e9_esgotarOLoteLiberaOProximo() throws Exception {
        assertEquals(400, saida("LOT202", 100).status());           // antes: bloqueado
        assertEquals(200, saida("LOT201", 1000).status());          // esgota o LOT201
        assertEquals(200, saida("LOT202", 100).status());           // agora o LOT202 é o próximo
    }

    @Test
    void bloqueiosFicamRegistradosNasMovimentacoes() throws Exception {
        saida("LOT201", 100);
        saida("LOT202", 100);
        String corpo = getUrl("/api/movimentacoes").corpo();
        assertTrue(corpo.contains("SAIDA"), corpo);
        assertTrue(corpo.contains("TENTATIVA_BLOQUEADA"), corpo);
    }

    @Test
    void codigoRepetidoEFileiraOcupadaSaoRecusados() throws Exception {
        Resp repetido = lote("LOT201", "Qualquer", "F99", 10, 0, 30);
        assertEquals(400, repetido.status());
        assertTrue(repetido.corpo().contains("Já existe"), repetido.corpo());
        Resp ocupada = lote("LOT777", "Qualquer", "F01", 10, 0, 30);
        assertEquals(400, ocupada.status());
        assertTrue(ocupada.corpo().contains("ocupada"), ocupada.corpo());
    }

    @Test
    void validadeAnteriorAEntradaERecusada() throws Exception {
        assertEquals(400, lote("LOT778", "Qualquer", "F98", 10, 0, -5).status());
    }

    @Test
    void payloadInvalidoRetorna422() throws Exception {
        assertEquals(422, postJson("/api/saidas", "{\"codigoQr\":\"\",\"quantidade\":-1}").status());
        assertEquals(422, postJson("/api/saidas", "isto nao e json").status());
    }
}
