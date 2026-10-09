import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import GameHub from './components/GameHub.jsx'
import { activityTypes } from './game/gameEngine.js'
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Camera, Check,
  ChevronDown, Clock3, Compass, Footprints, Heart, LocateFixed, Map as MapIcon,
  MapPin, Mountain, Navigation, Pause, Play, Search, Share2,
  ShieldAlert, SlidersHorizontal, Star, StopCircle, Trees, Upload, X, Gamepad2,
} from 'lucide-react'
const MapCanvas = lazy(() => import('./components/TrailMap.jsx'))

function TrailMap(props) {
  return (
    <Suspense fallback={<div className="map-loading">A preparar cartografia...</div>}>
      <MapCanvas {...props} />
    </Suspense>
  )
}
import { officialSources, trails } from './data/trails.js'
import { useGpsTracking } from './hooks/useGpsTracking.js'
import { getActivities, saveActivity } from './services/activityStorage.js'
import { gameApi } from './services/gameApi.js'
import { distanceAlongRoute, distanceBetweenCoordinates } from './utils/geo.js'

const tabs = [
  { id: 'explore', label: 'Explorar', icon: Compass },
  { id: 'map', label: 'Mapa', icon: MapIcon },
  { id: 'activities', label: 'Atividades', icon: Footprints },
  { id: 'game', label: 'Jogo', icon: Gamepad2 },
  { id: 'profile', label: 'Perfil', icon: Mountain },
]

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
}

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`
}

function distanceToTrail(position, trail) {
  return distanceBetweenCoordinates(position, trail.coordinates)
}

function TrailCard({ trail, onOpen, compact = false }) {
  return (
    <button type="button" className={`trail-card ${compact ? 'trail-card-compact' : ''}`} onClick={() => onOpen(trail)}>
      <div className="trail-image-wrap">
        <img className="trail-image" src={trail.image} alt={trail.imageAlt} loading="lazy" />
        <span className="trail-code">{trail.code}</span>
        <span className="condition-badge"><span className="condition-dot" /> Consultar estado</span>
        <span className="trail-image-gradient" />
      </div>
      <div className="trail-card-info">
        <span className="trail-municipality"><MapPin size={12} />{trail.municipality}</span>
        <h3>{trail.name}</h3>
        <p>{trail.summary}</p>
        <span className="trail-card-footer"><span><Footprints size={14} /> {trail.distance} km</span><span><Clock3 size={14} /> {trail.duration}</span><ArrowRight size={16} /></span>
      </div>
    </button>
  )
}

function ElevationProfile({ trail }) {
  const points = trail.profile.map((height, index) => `${(index / (trail.profile.length - 1)) * 100},${100 - height * 80}`).join(' ')
  return (
    <div className="profile-chart" aria-label={`Perfil de altitude esquemático de ${trail.name}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-hidden="true">
        <defs><linearGradient id="profileFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#587660" stopOpacity=".3" /><stop offset="100%" stopColor="#587660" stopOpacity=".02" /></linearGradient></defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#profileFill)" />
        <polyline points={points} fill="none" stroke="#41654f" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="profile-ends"><span>{trail.start}</span><span>{trail.end}</span></div>
      <div className="profile-note">Perfil esquemático · confirmar dados altimétricos oficiais</div>
    </div>
  )
}

function TrailDetail({ trail, onBack, onStart, onLike, liked, comment, setComment, onComment, onPhoto, photos, comments, rating, onRate }) {
  return (
    <div className="detail-page">
      <div className="detail-hero" style={{ backgroundImage: `linear-gradient(0deg,rgba(14,31,27,.86),rgba(14,31,27,0) 72%),url("${trail.image}")` }}>
        <button className="hero-back icon-button" type="button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <button className="hero-share icon-button" type="button" onClick={() => navigator.share?.({ title: trail.name, url: location.href })} aria-label="Partilhar trilho"><Share2 size={18} /></button>
        <div className="detail-hero-copy"><span>{trail.code} <i>·</i> {trail.municipality}</span><h1>{trail.name}</h1><p><MapPin size={14} /> {trail.start} <ArrowRight size={13} /> {trail.end}</p></div>
      </div>
      <div className="detail-content">
        <div className="official-status"><span className="status-mark"><ShieldAlert size={18} /></span><div><strong>Consultar fonte oficial</strong><small>Estado não confirmado · sem data de verificação</small></div><a href={officialSources[0].url} target="_blank" rel="noreferrer">Verificar <ArrowRight size={14} /></a></div>
        <div className="detail-stats"><div><strong>{trail.distance} <small>km</small></strong><span>Distância estimada</span></div><div><strong>{trail.duration}</strong><span>Duração estimada</span></div><div><strong>{trail.difficulty}</strong><span>Dificuldade estimada</span></div><div><strong>↑ {trail.ascent} <small>m</small></strong><span>Desnível estimado</span></div></div>
        <section className="detail-section"><div className="section-heading"><div><span className="section-kicker">O terreno</span><h2>Perfil de altitude</h2></div><Mountain size={20} /></div><ElevationProfile trail={trail} /></section>
        <section className="detail-section"><div className="section-heading"><div><span className="section-kicker">Prepara a caminhada</span><h2>Condições do percurso</h2></div><ShieldAlert size={20} /></div>
          <div className="conditions-grid">{[['Desnível negativo', `${trail.descent} m · estimado`], ['Altitude máxima', `${trail.maxAltitude} m · estimada`], ['Piso', trail.surface], ['Exposição', trail.exposure], ['Túneis', trail.tunnels], ['Escadas', trail.stairs], ['Passagens estreitas', trail.narrow], ['Acesso', `${trail.parking} · ${trail.transport}`]].map(([label, value]) => <div className="condition-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="hazard-callout"><ShieldAlert size={17} /><span><strong>Atenção às condições.</strong> {trail.hazards}. Consulta o estado atualizado antes de partir.</span></div>
        </section>
        <section className="detail-section"><div className="section-heading"><div><span className="section-kicker">Ao longo do caminho</span><h2>Pontos de interesse</h2></div><MapPin size={20} /></div><div className="poi-list">{trail.points.map((point, index) => <div className="poi-row" key={point}><span className="poi-index">0{index + 1}</span><strong>{point}</strong><span className="poi-distance">Localização aproximada</span></div>)}</div></section>
        <section className="detail-section"><div className="section-heading"><div><span className="section-kicker">Da comunidade</span><h2>Fotografias e notas</h2></div><Camera size={20} /></div>
          <div className="community-actions"><button type="button" className="soft-action" onClick={onLike}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Gostaste' : 'Gosto'}</button><label className="soft-action upload-label"><Upload size={16} /> Adicionar foto<input type="file" accept="image/*" onChange={onPhoto} /></label></div>
          <div className="rating-control"><span>A tua avaliação</span>{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= rating ? 'rated' : ''} onClick={() => onRate(value)} aria-label={`Avaliar ${value} de 5`} title={`${value} de 5`}><Star size={15} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div>
          {photos.length > 0 && <div className="community-photos">{photos.map((photo) => <img key={photo} src={photo} alt="Fotografia partilhada pela comunidade" />)}</div>}
          {comments.length > 0 && <div className="comment-list">{comments.map((item, index) => <article className="community-comment" key={`${item.date}-${index}`}><strong>Nota local</strong><p>{item.text}</p><time dateTime={item.date}>{new Date(item.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}</time></article>)}</div>}
          <form className="comment-form" onSubmit={onComment}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Deixa uma nota sobre o trilho" aria-label="Deixa uma nota sobre o trilho" maxLength={300} /><button className="comment-submit" type="submit" disabled={!comment.trim()} aria-label="Publicar nota"><ArrowRight size={18} /></button></form>
          <p className="community-note">Gosto, fotos e notas guardam-se neste dispositivo. Sem publicação online.</p>
        </section>
        <section className="source-section"><div><span className="section-kicker">Informação</span><h2>Fontes e transparência</h2><p>Dados de percurso apresentados como estimativas. O estado oficial e a geometria GPS ainda não foram verificados.</p></div><div className="source-links">{officialSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>{source.label}<ArrowUpRight size={13} /></a>)}</div><span className="last-checked">Última verificação oficial: não disponível</span></section>
      </div>
      <div className="detail-cta"><span><strong>{trail.distance} km</strong><small>estimados</small></span><button type="button" className="primary-button" onClick={onStart}><Play size={15} fill="currentColor" /> Iniciar trilho</button></div>
    </div>
  )
}

export default function App() {
  const [authStatus, setAuthStatus] = useState('checking')
  const [authUser, setAuthUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [page, setPage] = useState('explore')
  const [search, setSearch] = useState('')
  const [selectedTrail, setSelectedTrail] = useState(null)
  const [activities, setActivities] = useState(getActivities)
  const [activityType, setActivityType] = useState('walking')
  const [community, setCommunity] = useState(() => {
    try { return JSON.parse(localStorage.getItem('madeira-trails:community') || '{}') } catch { return {} }
  })
  const [comment, setComment] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [installPrompt, setInstallPrompt] = useState(null)
  const gps = useGpsTracking()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true
    gameApi.me().then(({ user }) => {
      if (active) { setAuthUser(user); setAuthStatus('authenticated') }
    }).catch(() => {
      if (active) setAuthStatus('unauthenticated')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const captureInstall = (event) => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener('beforeinstallprompt', captureInstall)
    return () => window.removeEventListener('beforeinstallprompt', captureInstall)
  }, [])

  useEffect(() => {
    try { localStorage.setItem('madeira-trails:community', JSON.stringify(community)) } catch { /* local storage can be disabled */ }
  }, [community])

  const filteredTrails = useMemo(() => trails.filter((trail) => {
    const matchesSearch = `${trail.name} ${trail.code} ${trail.municipality} ${trail.difficulty}`.toLocaleLowerCase('pt-PT').includes(search.toLocaleLowerCase('pt-PT'))
    const matchesDifficulty = filter === 'Todos' || trail.difficulty === filter
    return matchesSearch && matchesDifficulty
  }), [search, filter])
  const nearestTrails = useMemo(() => gps.position
    ? [...trails].sort((first, second) => distanceToTrail(gps.position, first) - distanceToTrail(gps.position, second)).slice(0, 3)
    : [], [gps.position])

  const openTrail = (trail) => { setSelectedTrail(trail); setPage('explore'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const beginTrail = async (trail = selectedTrail) => {
    if (trail) { setSelectedTrail(trail); setPage('map') }
    await gps.start()
  }

  const endWalk = () => {
    const result = gps.stop()
    const activity = {
      id: crypto.randomUUID(),
      trailName: selectedTrail?.name ?? 'Caminhada livre',
      trailCode: selectedTrail?.code ?? null,
      municipality: selectedTrail?.municipality ?? null,
      activityType,
      date: new Date().toISOString(),
      distance: result.distance,
      elapsed: result.elapsed,
      points: result.points,
    }
    saveActivity(activity)
    setActivities(getActivities())
    setIsSaving(true)
    setPage('activities')
  }

  const locateAndShow = async () => {
    try { await gps.locate() } catch { /* GPS error is shown on the current screen */ }
  }

  const updateCommunity = (trailId, change) => setCommunity((previous) => ({ ...previous, [trailId]: { ...previous[trailId], ...change } }))

  const onAddPhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedTrail) return
    const reader = new FileReader()
    reader.onload = () => {
      const photos = [...(community[selectedTrail.id]?.photos ?? []), reader.result]
      updateCommunity(selectedTrail.id, { photos })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    try {
      const result = authMode === 'register'
        ? await gameApi.register(authUsername.trim(), authPassword)
        : await gameApi.login(authUsername.trim(), authPassword)
      setAuthUser(result.user)
      setAuthStatus('authenticated')
      setAuthPassword('')
    } catch (error) {
      setAuthError(error.message || 'Não foi possível validar os dados. Tenta novamente.')
    } finally {
      setAuthBusy(false)
    }
  }

  const signOut = async () => {
    try { await gameApi.logout() } catch { /* fecha a interface mesmo se a rede falhar */ }
    setAuthUser(null)
    setAuthPassword('')
    setAuthStatus('unauthenticated')
    setAuthMode('login')
    setPage('explore')
    setSelectedTrail(null)
  }

  const onAddComment = (event) => {
    event.preventDefault()
    if (!comment.trim() || !selectedTrail) return
    const comments = [...(community[selectedTrail.id]?.comments ?? []), { text: comment.trim(), date: new Date().toISOString() }]
    updateCommunity(selectedTrail.id, { comments })
    setComment('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setPage('explore'); setSelectedTrail(null) }}><span className="brand-mark"><Mountain size={21} strokeWidth={2.1} /></span><span><strong>MADEIRA</strong><small>TRAILS</small></span></a>
        <div className="sidebar-label">A ILHA, A PÉ</div>
        <nav className="side-nav" aria-label="Navegação principal">{tabs.map(({ id, label, icon: Icon }) => <button className={page === id ? 'active' : ''} type="button" key={id} onClick={() => { setPage(id); setSelectedTrail(null) }}><Icon size={18} />{label}{id === 'activities' && activities.length > 0 && <span className="nav-count">{activities.length}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-status"><span className="source-status-icon"><ShieldAlert size={15} /></span><div><strong>Estado dos trilhos</strong><small>Confirmar fonte oficial</small></div><ChevronDown size={14} /></div><div className="sidebar-island"><span>32°45′ N</span><span>16°57′ W</span><Mountain size={42} strokeWidth={1} /><small>Arquipélago da Madeira</small></div><span className="sidebar-version">MADEIRA, PORTUGAL · {new Date().getFullYear()}</span></div>
      </aside>

      <div className="app-main">
        <header className="topbar"><button className="mobile-brand" type="button" onClick={() => { setPage('explore'); setSelectedTrail(null) }}><span className="brand-mark"><Mountain size={18} /></span> MADEIRA TRAILS</button><div className="topbar-location"><MapPin size={14} /> Ilha da Madeira <span>·</span> Portugal</div><div className="topbar-actions"><button className="topbar-icon" type="button" onClick={() => setPage('profile')} aria-label="Perfil"><Mountain size={17} /></button></div></header>

        <main className="workspace">
          {selectedTrail && page === 'explore' ? <TrailDetail trail={selectedTrail} onBack={() => setSelectedTrail(null)} onStart={() => beginTrail(selectedTrail)} onLike={() => updateCommunity(selectedTrail.id, { liked: !community[selectedTrail.id]?.liked })} liked={!!community[selectedTrail.id]?.liked} comment={comment} setComment={setComment} onComment={onAddComment} onPhoto={onAddPhoto} photos={community[selectedTrail.id]?.photos ?? []} comments={community[selectedTrail.id]?.comments ?? []} rating={community[selectedTrail.id]?.rating ?? 0} onRate={(rating) => updateCommunity(selectedTrail.id, { rating })} /> : <>
            {page === 'explore' && <section className="explore-page">
              <div className="welcome-banner"><img src={trails[0].image} alt="Paisagem de montanha na Madeira" fetchPriority="high" /><div className="welcome-shade" /><div className="welcome-copy"><span className="eyebrow"><span className="sun-mark">✳</span> FEITA PARA IR MAIS LONGE</span><h1>A ilha começa<br />no caminho.</h1><p>Levadas, veredas e montanha. Descobre a Madeira, passo a passo.</p><button className="banner-button" type="button" onClick={() => { setPage('map'); setSelectedTrail(null) }}>Explorar mapa <ArrowRight size={15} /></button></div><div className="banner-caption">MADEIRA · 32° 45′ N 16° 57′ W</div><div className="banner-index">01 <span>/</span> 04</div></div>
              <div className="page-heading"><div><span className="section-kicker">Descobre a ilha</span><h1>Bom dia, caminheiro <span className="greeting-star">✳</span></h1><p>Um bom trilho começa com informação certa.</p></div><button className="location-button" type="button" onClick={locateAndShow}><LocateFixed size={15} /> Trilhos perto de mim</button></div>
              <div className="official-notice"><span className="notice-icon"><ShieldAlert size={18} /></span><div><strong>Confirma sempre antes de sair.</strong><span>O estado dos percursos não está verificado em tempo real. Consulta as fontes oficiais.</span></div><a href={officialSources[0].url} target="_blank" rel="noreferrer">Fontes <ArrowUpRight size={13} /></a></div>
              {gps.error && <div className="inline-error" role="status">{gps.error}</div>}
              {nearestTrails.length > 0 && <><div className="section-title-row nearby-heading"><div><span className="section-kicker">Pontos aproximados · em linha reta</span><h2>Perto da tua posição</h2></div><button className="text-action" type="button" onClick={() => setPage('map')}>Ver mapa <ArrowRight size={15} /></button></div><div className="nearby-list">{nearestTrails.map((trail) => <button className="nearby-item" key={trail.id} type="button" onClick={() => openTrail(trail)}><span className="nearby-code">{trail.code}</span><span className="nearby-name"><strong>{trail.name}</strong><small>{trail.municipality} · percurso {trail.distance} km estimado</small></span><span className="nearby-distance">{formatDistance(distanceToTrail(gps.position, trail))}</span><ArrowRight size={15} /></button>)}</div></>}
              <div className="section-title-row"><div><span className="section-kicker">Para começar</span><h2>Trilhos populares</h2></div><button className="text-action" type="button" onClick={() => { setPage('map'); setSelectedTrail(null) }}>Abrir mapa <ArrowRight size={15} /></button></div>
              <div className="search-row"><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Procurar trilho, código ou município" aria-label="Pesquisar trilhos" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpar pesquisa"><X size={16} /></button>}</label><label className="filter-box"><SlidersHorizontal size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtrar por dificuldade"><option>Todos</option><option>Moderado</option><option>Difícil</option></select></label></div>
              {filteredTrails.length ? <div className="trail-grid">{filteredTrails.map((trail) => <TrailCard key={trail.id} trail={trail} onOpen={openTrail} />)}</div> : <div className="empty-state"><Search size={24} /><h3>Nenhum trilho encontrado</h3><p>Experimenta outro nome, código ou município.</p></div>}
              <div className="discover-strip"><span className="discover-icon"><Trees size={20} /></span><div><span className="section-kicker">Explora sem pressa</span><strong>Da Laurissilva ao mar.</strong><span>Encontra o teu próximo caminho na ilha.</span></div><button type="button" onClick={() => { setPage('map'); setSelectedTrail(null) }} aria-label="Explorar mapa"><ArrowRight size={19} /></button></div>
            </section>}

            {page === 'map' && <section className="map-page"><div className="map-page-heading"><div><button className="back-link" type="button" onClick={() => { setPage('explore'); setSelectedTrail(null) }}><ArrowLeft size={14} /> Descobrir</button><span className="section-kicker">Cartografia · OpenStreetMap</span><h1>{selectedTrail ? selectedTrail.name : 'A ilha, à tua escala.'}</h1><p>{selectedTrail ? `${selectedTrail.code} · ${selectedTrail.start} → ${selectedTrail.end}` : 'Explora a Ilha da Madeira e encontra o teu caminho.'}</p></div><span className="map-live-status"><span className="condition-dot" />{gps.tracking ? gps.paused ? 'EM PAUSA' : 'GPS ATIVO' : 'GPS DESLIGADO'}</span></div>
              <div className="map-layout"><div className="map-frame"><TrailMap trail={selectedTrail} position={gps.position} points={gps.points} onLocate={locateAndShow} onStart={() => beginTrail(selectedTrail)} tracking={gps.tracking} paused={gps.paused} /></div><aside className="map-panel"><span className="section-kicker">{gps.tracking ? gps.paused ? 'Em descanso' : 'Caminhada em curso' : 'Caminhada'}</span><h2>{gps.tracking ? selectedTrail?.name ?? 'Caminhada livre' : selectedTrail?.name ?? 'Pronto a partir?'}</h2><p>{selectedTrail ? `${selectedTrail.start} até ${selectedTrail.end}` : 'Regista uma caminhada com GPS. O percurso e as métricas ficam guardados neste dispositivo.'}</p>
                {gps.tracking ? <><div className="tracking-metrics"><div><span>Tempo decorrido</span><strong>{formatTime(gps.elapsed)}</strong></div><div><span>Distância percorrida</span><strong>{formatDistance(distanceAlongRoute(gps.points))}</strong></div><div><span>Distância restante</span><strong>—</strong></div><div><span>Altitude GPS</span><strong>{gps.altitude == null ? '—' : `${Math.round(gps.altitude)} m`}</strong></div><div><span>Velocidade GPS</span><strong>{gps.speed == null ? '—' : `${(gps.speed * 3.6).toFixed(1)} km/h`}</strong></div></div><div className="route-disclaimer">Distância restante indisponível sem um traçado GPX oficial verificado.</div><div className="tracking-controls"><button type="button" className="pause-button" onClick={gps.pause}>{gps.paused ? <Play size={15} /> : <Pause size={15} />}{gps.paused ? 'Retomar' : 'Pausar'}</button><button type="button" className="finish-button" onClick={endWalk}><StopCircle size={16} /> Terminar</button></div></> : <><div className="map-trail-stats"><span><Footprints size={15} />{selectedTrail ? `${selectedTrail.distance} km · estimados` : 'Traçado GPS real'}</span><span><Clock3 size={15} />{selectedTrail ? `${selectedTrail.duration} · estimada` : 'Tempo em movimento'}</span></div><label className="activity-type-select"><span>Modalidade da atividade</span><select value={activityType} onChange={(event) => setActivityType(event.target.value)}>{activityTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label><div className="route-disclaimer">{selectedTrail ? 'Traçado GPS oficial ainda não disponível. O marcador indica uma localização aproximada; não representa a rota.' : 'A tua trajetória aparece no mapa assim que o GPS registar pontos.'}</div><button type="button" className="primary-button full-button" onClick={() => beginTrail(selectedTrail)}><Navigation size={15} /> Iniciar com GPS</button></>}
                {gps.error && <div className="inline-error" role="status">{gps.error}</div>}
                <div className="map-panel-footer"><ShieldAlert size={14} /> Estado oficial: consultar fonte oficial.</div>
              </aside></div>
              <div className="map-trails-row"><div className="section-title-row"><div><span className="section-kicker">Pontos na ilha</span><h2>Trilhos para explorar</h2></div></div><div className="map-trail-list">{trails.map((trail) => <button type="button" className={`map-trail-chip ${selectedTrail?.id === trail.id ? 'selected' : ''}`} key={trail.id} onClick={() => setSelectedTrail(trail)}><span>{trail.code}</span>{trail.name}<ArrowRight size={14} /></button>)}</div></div>
            </section>}

            {page === 'game' && <GameHub activities={activities} onStartActivity={(type = activityType) => { setActivityType(type); setSelectedTrail(null); setPage('map') }} />}

            {page === 'activities' && <section className="activities-page subpage"><div className="subpage-heading"><div><span className="section-kicker">O teu caminho</span><h1>Cada passo conta.</h1><p>As caminhadas ficam guardadas apenas neste dispositivo.</p></div><span className="subpage-mark"><Activity size={23} /></span></div>{gps.tracking && <div className="activity-live"><span className="live-dot" /><div><strong>Caminhada em curso</strong><small>{formatTime(gps.elapsed)} · {formatDistance(distanceAlongRoute(gps.points))}</small></div><button type="button" onClick={() => setPage('map')}>Abrir mapa <ArrowRight size={14} /></button></div>}
              {isSaving && <div className="saved-banner"><Check size={17} /> Caminhada guardada neste dispositivo.<button type="button" onClick={() => setIsSaving(false)} aria-label="Fechar"><X size={15} /></button></div>}
              {activities.length > 0 ? <><div className="activity-summary"><div><span>Total de caminhadas</span><strong>{activities.length}</strong></div><div><span>Distância registada</span><strong>{(activities.reduce((sum, item) => sum + (item.distance || 0), 0) / 1000).toFixed(1)} <small>km</small></strong></div><div><span>Tempo em movimento</span><strong>{Math.floor(activities.reduce((sum, item) => sum + (item.elapsed || 0), 0) / 60)} <small>min</small></strong></div></div><div className="activity-list">{activities.map((activity) => <article className="activity-card" key={activity.id}><span className="activity-icon"><Footprints size={19} /></span><div className="activity-card-main"><strong>{activity.trailName}</strong><span>{new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div><div className="activity-result"><strong>{formatDistance(activity.distance)}</strong><span>{formatTime(activity.elapsed)}</span></div></article>)}</div></> : <div className="empty-state activity-empty"><span className="empty-illustration"><Mountain size={30} /></span><h2>O primeiro caminho é teu.</h2><p>Inicia uma caminhada para guardar o trajeto, a distância e o tempo no teu dispositivo.</p><button type="button" className="primary-button" onClick={() => setPage('explore')}><Compass size={16} /> Encontrar um trilho</button></div>}
              <p className="privacy-note"><ShieldAlert size={14} /> Atividades guardadas localmente. Não são enviadas para um servidor.</p></section>}

            {page === 'profile' && <section className="profile-page subpage"><div className="subpage-heading"><div><span className="section-kicker">O teu espaço</span><h1>Perfil de caminheiro.</h1><p>Uma presença local, pronta para crescer contigo.</p></div><span className="profile-avatar"><Mountain size={26} /></span></div><div className="profile-stats"><div><Footprints size={17} /><strong>{activities.length}</strong><span>caminhadas</span></div><div><MapPin size={17} /><strong>{new Set(activities.map((activity) => activity.trailCode).filter(Boolean)).size}</strong><span>trilhos</span></div><div><Heart size={17} /><strong>{Object.values(community).filter((item) => item.liked).length}</strong><span>favoritos</span></div></div><section className="profile-section">
  {authStatus === 'authenticated' ? <>
    <div className="section-title-row">
      <div><span className="section-kicker">A tua conta</span><h2>{authUser?.username || 'Caminheiro'}</h2></div>
      <button className="auth-logout" type="button" onClick={signOut}>Terminar sessão</button>
    </div>
    <p className="profile-copy">Sessão iniciada. O teu acesso ao Madeira Quest e a sincronização do progresso estão associados a esta conta.</p>
    <div className="profile-feature-list"><span><Camera size={16} /> Fotografias locais</span><span><Heart size={16} /> Gostos locais</span><span><Star size={16} /> Avaliações preparadas para API</span><span><Activity size={16} /> Atividades guardadas</span></div>
  </> : <>
    <div className="section-title-row">
      <div><span className="section-kicker">A tua conta é opcional</span><h2>Estás a explorar como visitante.</h2></div>
    </div>
    <p className="profile-copy">Podes consultar trilhos e usar o mapa sem criar conta nem instalar a aplicação. A conta é necessária apenas para funcionalidades online do Madeira Quest.</p>
    {authStatus === 'checking' ? <p className="profile-copy" role="status">A verificar se já tens uma sessão ativa…</p> : <>
      <div className="auth-tabs" role="tablist" aria-label="Acesso à conta Madeira Trails">
        <button type="button" role="tab" aria-selected={authMode === 'login'} className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setAuthError('') }}>Iniciar sessão</button>
        <button type="button" role="tab" aria-selected={authMode === 'register'} className={authMode === 'register' ? 'active' : ''} onClick={() => { setAuthMode('register'); setAuthError('') }}>Criar conta</button>
      </div>
      <form className="auth-form" onSubmit={submitAuth}>
        <label>Nome de jogador<input autoComplete="username" value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" required placeholder="Ex.: caminheiro_01" /></label>
        <label>Palavra-passe<input type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} minLength={12} maxLength={128} required placeholder="Mínimo de 12 caracteres" /></label>
        {authMode === 'register' && <p className="auth-hint">Nome: 3–20 letras, números ou _. Palavra-passe: pelo menos 12 caracteres.</p>}
        {authError && <p className="auth-message error" role="alert">{authError}</p>}
        <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'A validar…' : authMode === 'register' ? 'Criar conta' : 'Iniciar sessão'} <ArrowRight size={17} /></button>
      </form>
    </>}
  </>}
  <div className="profile-install-panel">
    <div><strong>Instalação opcional</strong><p>O site funciona diretamente no navegador. Não precisas de instalar a aplicação para explorar os trilhos.</p></div>
    {installPrompt && <button className="install-profile-button" type="button" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null) }}>Instalar aplicação</button>}
  </div>
</section><section className="source-section profile-source"><div><span className="section-kicker">Transparência</span><h2>Fontes da ilha</h2><p>Verifica informações e condições nos canais oficiais.</p></div><div className="source-links">{officialSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>{source.label}<ArrowUpRight size={13} /></a>)}</div></section></section>}
          </>}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação"><span className="bottom-brand">M</span>{tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); if (id !== 'explore') setSelectedTrail(null) }}><Icon size={19} /><span>{label}</span></button>)}</nav>
      <div className="sr-only" aria-live="polite">{gps.error}</div>
    </div>
  )
}