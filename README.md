# Madeira Trails

Aplicação web/PWA mobile-first para descobrir percursos pedestres na Ilha da Madeira e registar caminhadas no próprio dispositivo. Não exige conta nem tem backend.

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
- Estrutura de serviços pronta para substituir o catálogo e armazenamento locais por uma API futura.

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

O `railway.json` define build e start para o serviço web. O processo de produção escuta em `0.0.0.0:$PORT`. Liga o repositório no Railway e publica o serviço; não são necessárias variáveis ou bases de dados nesta fase.

## Próximos passos de produto

1. Validar cada campo do catálogo com IFCN/Visit Madeira e guardar URL, data e proveniência por percurso.
2. Importar geometrias GPX autorizadas; só então calcular distância restante, orientação de rota e cobertura offline selecionada.
3. Substituir `trailService` e o armazenamento local por API, autenticação opcional e backend para comentários, fotografias, avaliações e seguidores.
4. Gerar ícones PNG 192/512 px a partir da identidade final e testar instalação/atualização em Android real.# Madeira-trails