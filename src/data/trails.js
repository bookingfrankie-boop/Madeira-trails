export const officialSources = [
  { label: 'IFCN · Governo Regional', url: 'https://ifcn.madeira.gov.pt/' },
  { label: 'Visit Madeira', url: 'https://visitmadeira.com/pt/experiencias/natureza/atividades/percursos-pedestres-recomendados/' },
  { label: 'SIMplifica', url: 'https://simplifica.madeira.gov.pt/' },
  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
]

export const trails = [
  {
    id: 'pr1', code: 'PR 1', name: 'Vereda do Areeiro', municipality: 'Funchal · Santana',
    start: 'Pico do Areeiro', end: 'Pico Ruivo', distance: 7, duration: '3 h 30', ascent: 1000,
    descent: 700, maxAltitude: 1862, difficulty: 'Difícil', surface: 'Vereda de montanha',
    exposure: 'Exposição elevada · confirmar condições', tunnels: 'A confirmar', stairs: 'A confirmar',
    narrow: 'Passagens estreitas · confirmar', hazards: 'Nevoeiro, vento e exposição · verificar fonte oficial',
    points: ['Pico do Areeiro', 'Ninho da Manta', 'Pico Ruivo'], parking: 'Pico do Areeiro · confirmar disponibilidade',
    transport: 'A confirmar junto de operadores locais', coordinates: [-16.928, 32.735],
    image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'Montanhas cobertas de vegetação sob a luz da manhã',
    summary: 'Uma travessia de alta montanha entre dois dos picos mais emblemáticos da ilha.',
    profile: [0.2, 0.46, 0.38, 0.65, 0.54, 0.76, 0.68, 0.92, 0.8],
  },
  {
    id: 'pr6', code: 'PR 6', name: 'Levada das 25 Fontes', municipality: 'Calheta',
    start: 'Rabaçal', end: 'Lagoa das 25 Fontes', distance: 4.6, duration: '3 h', ascent: 300,
    descent: 300, maxAltitude: 1290, difficulty: 'Moderado', surface: 'Levada e vereda',
    exposure: 'A confirmar', tunnels: 'A confirmar', stairs: 'A confirmar', narrow: 'A confirmar',
    hazards: 'Piso húmido e irregular · confirmar fonte oficial',
    points: ['Casa Florestal do Rabaçal', 'Risco', 'Lagoa das 25 Fontes'],
    parking: 'Rabaçal · confirmar disponibilidade', transport: 'A confirmar junto de operadores locais',
    coordinates: [-17.133, 32.753],
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'Floresta verde e densa da Laurissilva',
    summary: 'Um percurso de levada pela Laurissilva até à lagoa alimentada por dezenas de nascentes.',
    profile: [0.64, 0.56, 0.61, 0.46, 0.52, 0.37, 0.43, 0.27, 0.35],
  },
  {
    id: 'pr8', code: 'PR 8', name: 'Vereda da Ponta de São Lourenço', municipality: 'Machico',
    start: 'Baía d’Abra', end: 'Casa do Sardinha', distance: 6, duration: '2 h 30', ascent: 400,
    descent: 400, maxAltitude: 160, difficulty: 'Moderado', surface: 'Vereda costeira',
    exposure: 'Exposição ao sol e vento · confirmar', tunnels: 'A confirmar', stairs: 'A confirmar',
    narrow: 'A confirmar', hazards: 'Pouca sombra e vento · verificar fonte oficial',
    points: ['Miradouro da Ponta do Rosto', 'Casa do Sardinha'],
    parking: 'Baía d’Abra · confirmar disponibilidade', transport: 'A confirmar junto de operadores locais',
    coordinates: [-16.694, 32.742],
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'Costa atlântica recortada por falésias',
    summary: 'Uma península vulcânica de cores contrastantes, com vistas abertas sobre o Atlântico.',
    profile: [0.24, 0.48, 0.42, 0.67, 0.52, 0.77, 0.59, 0.88, 0.72],
  },
  {
    id: 'pr9', code: 'PR 9', name: 'Levada do Caldeirão Verde', municipality: 'Santana',
    start: 'Parque Florestal das Queimadas', end: 'Caldeirão Verde', distance: 13, duration: '5 h 30', ascent: 100,
    descent: 100, maxAltitude: 980, difficulty: 'Moderado', surface: 'Levada e vereda',
    exposure: 'A confirmar', tunnels: 'A confirmar', stairs: 'A confirmar', narrow: 'A confirmar',
    hazards: 'Túneis e piso húmido · confirmar condições oficiais',
    points: ['Parque das Queimadas', 'Caldeirão Verde'],
    parking: 'Queimadas · confirmar disponibilidade', transport: 'A confirmar junto de operadores locais',
    coordinates: [-16.911, 32.783],
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'Vegetação densa numa floresta de montanha',
    summary: 'Uma levada longa através da floresta Laurissilva até a uma cascata encaixada na rocha.',
    profile: [0.48, 0.5, 0.46, 0.53, 0.49, 0.56, 0.5, 0.59, 0.55],
  },
]

export const communityContent = {
  pr1: { rating: null, likes: 0, photos: [], comments: [] },
  pr6: { rating: null, likes: 0, photos: [], comments: [] },
  pr8: { rating: null, likes: 0, photos: [], comments: [] },
  pr9: { rating: null, likes: 0, photos: [], comments: [] },
}

export const dataProvenance = {
  routeFacts: 'estimated',
  officialStatus: 'not-verified',
  officialCheckedAt: null,
  communityContent: 'local-only',
}