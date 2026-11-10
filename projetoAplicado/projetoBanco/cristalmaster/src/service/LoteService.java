package service;

@Service
public class LoteService {

    @Autowired
    private LoteRepository repository;

    public String validarBaixaLote(String produto, String loteInformado) {

        List<Lote> lotes = repository.findByProdutoOrderByDataEntradaAsc(produto);

        if (lotes.isEmpty()) {
            throw new RuntimeException(
                    "Nenhum lote encontrado para o produto.");
        }

        Optional<Lote> loteSolicitado = lotes.stream()
                .filter(l -> l.getCodigo().equals(loteInformado))
                .findFirst();

        if (loteSolicitado.isEmpty()) {
            throw new RuntimeException(
                    "Lote informado não existe.");
        }

        Optional<Lote> loteCorreto = lotes.stream()
                .filter(l -> l.getSaldo() > 0)
                .findFirst();

        if (loteCorreto.isEmpty()) {
            throw new RuntimeException(
                    "Produto sem saldo disponível.");
        }

        if (!loteCorreto.get().getCodigo().equals(loteInformado)) {

            throw new RuntimeException(
                    "FIFO violado. Lote correto: "
                            + loteCorreto.get().getCodigo());
        }

        return "Operação permitida";
    }

    @Bean
    CommandLineRunner testes(LoteService service) {

        return args -> {

            System.out.println(
                    service.validarBaixaLote(
                            "RESINA-A",
                            "LT001"));

        };
    }

}
