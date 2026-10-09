# Madeira Trails

Aplicação web/PWA mobile-first para explorar percursos e jogar Madeira Quest, com território limitado à ilha da Madeira. O modo local funciona sem conta; o modo multiplayer usa uma API Node.js e o serviço PostgreSQL já existente quando configurado.

## Desenvolvimento

Requisitos: Node.js 20 ou superior e npm.

```sh
npm install
npm run dev
```

O endereço local é indicado pelo Vite. Para verificar a versão de produção, executa `npm run build`; `npm run preview` serve essa versão.

## Funcionalidades

- Catálogo pesquisável, filtros, detalhes do percurso, perfil altimétrico esquemático e fontes oficiais.
- Mapa MapLibre GL com cartografia OpenStreetMap, posição GPS, acompanhamento e trajetória medida no dispositivo.
- Iniciar, pausar, retomar e terminar caminhadas. Atividades e notas sociais ficam em `localStorage`.
- Manifest PWA, atualizações automáticas do service worker, interface pré-armazenada e cache limitado de tiles já visitados.
- Madeira Quest: níveis, XP, missões, quatro modalidades e dez zonas municipais da ilha.
- API multiplayer em Node.js com contas, sessões HttpOnly, classificação global e agregados por zona.
- Validação server-side de amostras GPS com limites de território, duração e velocidade; a rota bruta não é persistida.
- Sem dependência de serviços pagos adicionais no código; reutiliza PostgreSQL já existente quando configurado.

## Dados e segurança no trilho

O catálogo inicial é uma base editorial de percursos conhecidos, não uma sincronização de dados oficiais. Distâncias, tempos, desníveis, altitudes, pontos e posições no mapa são indicativos. Perfis altimétricos são esquemáticos. Túneis, escadas, exposição, acesso e perigos ainda precisam de confirmação percurso a percurso.

**O estado oficial de todos os percursos é “Consultar fonte oficial”.** Não existe verificação automática nem data de última verificação. Não apresentamos um percurso como aberto ou fechado sem dados oficiais validados. A geometria GPS/GPX oficial também não está incluída: o mapa mostra um ponto aproximado, não um traçado planeado. Por isso, a distância restante não está disponível. A localização dos trilhos próximos é uma distância em linha reta até esse ponto aproximado, não a distância por estrada ou trilho.

Referências: [IFCN / Governo Regional da Madeira](https://ifcn.madeira.gov.pt/), [Visit Madeira](https://visitmadeira.com/pt/experiencias/natureza/atividades/percursos-pedestres-recomendados/), [SIMplifica](https://simplifica.madeira.gov.pt/) e [OpenStreetMap](https://www.openstreetmap.org/copyright). Confirma o estado, as regras de acesso, reservas e condições meteorológicas junto das entidades responsáveis antes de caminhar.

Fotografias editoriais são carregadas de Unsplash e o mapa necessita de ligação para obter tiles ainda não visitados. O service worker guarda a interface e pode reutilizar tiles de OpenStreetMap em cache; não garante cobertura cartográfica offline de uma zona inteira. O GPS requer permissão e uma origem segura HTTPS (ou localhost). Os dados locais não são sincronizados, publicados nem incluídos numa cópia de segurança.

## Estrutura

```text
src/
  components/       Mapa e componentes reutilizáveis
  data/             Percursos de referência e fontes
  hooks/            Ciclo de vida do GPS
  services/         Catálogo e persistência local
  utils/            Geometria e cálculos partilhados
  styles.css        Interface responsiva
public/
  icons/            Ícone da aplicação
  manifest.webmanifest
```

## Railway

O `railway.json` define build e start para o serviço web. O processo de produção escuta em `0.0.0.0:$PORT`. O servidor serve o frontend e a API no mesmo serviço. Para ativar multiplayer, configura `DATABASE_URL` no serviço web existente como referência privada ao Postgres existente; não criar outro projeto, serviço ou base de dados. Sem essa variável, o frontend continua disponível, mas a API devolve `503` e não permite contas globais. Não publicar antes de configurar e testar a ligação à base de dados.


## Madeira Quest — protótipo de jogo

A aplicação inclui uma primeira interface de progressão local para o jogo Madeira Quest. O único território jogável planeado é a ilha da Madeira (dez municípios); Porto Santo e outras regiões ficam fora do mapa do jogo. As modalidades disponíveis são caminhada, corrida, ciclismo e trilhos/montanha.

Nesta fase, XP, missões e zonas exploradas são calculados no dispositivo a partir das atividades locais. **Não existe ainda multiplayer, contas, classificação global, sincronização entre dispositivos, conquista concorrente de territórios nem validação antifraude no servidor.** As zonas assinaladas como exploradas representam o percurso selecionado na atividade, não uma validação geográfica independente. O protótipo não deve apresentar esses dados como uma competição global real.

Próximas etapas para o modo global:
1. Definir contas e consentimentos, com recolha mínima de dados e opção para apagar/exportar a conta.
2. Implementar API e persistência server-side, reutilizando infraestrutura existente apenas após auditoria de configuração, custos e segurança.
3. Validar atividades no servidor e definir regras transparentes de XP, missões, anti-GPS-spoofing e disputas territoriais.
4. Criar o mapa de zonas da ilha com limites geográficos licenciados e fontes verificadas.
5. Tornar a integração Strava opcional e limitada aos dados autorizados; o jogo deve funcionar sem conta Strava.
6. Testar acessibilidade, segurança física, privacidade de localização e utilização em dispositivos reais antes de qualquer publicação.

## Próximos passos de produto

1. Validar cada campo do catálogo com IFCN/Visit Madeira e guardar URL, data e proveniência por percurso.
2. Importar geometrias GPX autorizadas; só então calcular distância restante, orientação de rota e cobertura offline selecionada.
3. Substituir `trailService` e o armazenamento local por API, autenticação opcional e backend para comentários, fotografias, avaliações e seguidores.
4. Gerar ícones PNG 192/512 px a partir da identidade final e testar instalação/atualização em Android real.# Madeira-trails