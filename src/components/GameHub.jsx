import { useEffect, useState } from 'react'
import { Activity, Bike, Check, ChevronRight, Footprints, Flag, Globe2, LockKeyhole, LogOut, MapPin, Mountain, ShieldCheck, Sparkles, Target, Trophy, UserRound, Zap } from 'lucide-react'
import { activityTypes, getGameStats } from '../game/gameEngine.js'
import { gameApi } from '../services/gameApi.js'

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

const icons = { walking: Footprints, running: Activity, cycling: Bike, hiking: Mountain }

export default function GameHub({ activities, onStartActivity }) {
  const stats = getGameStats(activities)
  const [user, setUser] = useState(null)
  const [apiStatus, setApiStatus] = useState('checking')
  const [globalState, setGlobalState] = useState(null)
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function refreshGlobal() {
    const result = await gameApi.state()
    setGlobalState(result)
    return result
  }

  useEffect(() => {
    let active = true
    gameApi.health().then(async () => {
      if (!active) return
      setApiStatus('ready')
      try {
        const { user: currentUser } = await gameApi.me()
        if (!active) return
        setUser(currentUser)
        const result = await gameApi.state()
        if (active) setGlobalState(result)
      } catch { /* no active session */ }
    }).catch(() => {
      if (active) setApiStatus('offline')
    })
    return () => { active = false }
  }, [])

  async function handleAuth(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = mode === 'register'
        ? await gameApi.register(username, password)
        : await gameApi.login(username, password)
      setUser(result.user)
      setApiStatus('ready')
      setPassword('')
      await refreshGlobal()
      setNotice(mode === 'register' ? 'Conta criada. Já podes participar no jogo da ilha.' : 'Sessão iniciada.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function syncActivities() {
    setBusy(true)
    setError('')
    setNotice('')
    let accepted = 0
    let skipped = 0
    const failures = []
    try {
      for (const activity of activities) {
        try {
          const result = await gameApi.submitActivity(activity)
          if (!result.duplicate) accepted += 1
          else skipped += 1
        } catch (e) {
          failures.push(e.message)
        }
      }
      await refreshGlobal()
      if (failures.length) {
        setError(`${accepted} sincronizadas, ${skipped} já sincronizadas. ${failures[0]}`)
      } else {
        setNotice(`${accepted} atividades sincronizadas; ${skipped} já estavam no servidor.`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    try {
      await gameApi.logout()
      setUser(null)
      setGlobalState(null)
      setNotice('Sessão terminada neste dispositivo.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="game-page subpage">
      <div className="game-hero">
        <div className="game-hero-copy">
          <span className="game-eyebrow"><Sparkles size={13} /> MADEIRA QUEST · TEMPORADA ZERO</span>
          <h1>A ilha é o teu mundo de jogo.</h1>
          <p>Move-te na Madeira. Completa missões. Sobe de nível. Ajuda a tua comunidade a explorar a ilha.</p>
          <button type="button" className="game-start-button" onClick={() => onStartActivity()}>Começar atividade <ChevronRight size={16} /></button>
        </div>
        <div className="game-level-orb"><span>NÍVEL</span><strong>{stats.level}</strong><small>{stats.xp} XP local</small></div>
      </div>

      <div className="game-stats-grid">
        <article><span className="game-stat-icon"><Zap size={16} /></span><span>Experiência local</span><strong>{stats.xp} <small>XP</small></strong></article>
        <article><span className="game-stat-icon"><Footprints size={16} /></span><span>Atividades neste dispositivo</span><strong>{stats.totalActivities}</strong></article>
        <article><span className="game-stat-icon"><Flag size={16} /></span><span>Trilhos registados</span><strong>{stats.totalTrails}</strong></article>
      </div>

      <section className="game-section">
        <div className="game-section-heading"><div><span className="section-kicker">A tua progressão local</span><h2>Nível {stats.level} · Explorador da Madeira</h2></div><span className="game-xp-label">{stats.xpIntoLevel}/250 XP</span></div>
        <div className="game-progress"><span style={{ width: `${stats.levelProgress}%` }} /></div>
        <p className="game-muted">Cada 100 metros contam para a experiência local. A experiência global só é atribuída pelo servidor após validação.</p>
      </section>

      <section className="game-section">
        <div className="game-section-heading"><div><span className="section-kicker">Desafios ativos</span><h2>Missões da ilha</h2></div><span className="game-counter">{stats.completedMissions}/{stats.missions.length} concluídas</span></div>
        <div className="game-missions">
          {stats.missions.map((mission) => {
            const progress = mission.target ? Math.min(100, mission.progress / mission.target * 100) : 0
            return <article className={`game-mission ${mission.done ? 'is-complete' : ''}`} key={mission.id}>
              <span className="mission-icon">{mission.done ? <Check size={18} /> : <Target size={18} />}</span>
              <div className="mission-content"><div className="mission-title-row"><h3>{mission.title}</h3><strong>+{mission.reward} XP</strong></div><p>{mission.description}</p><div className="mission-progress"><span style={{ width: `${progress}%` }} /></div><small>{mission.id === 'five-km' ? formatDistance(mission.progress) + ' / 5 km' : mission.id === 'variety' ? `${mission.progress}/2 modalidades` : mission.id === 'trail-explorer' ? `${mission.progress}/2 trilhos` : `${mission.progress}/1 atividade`}</small></div>
              {mission.done && <span className="mission-complete">Concluída</span>}
            </article>
          })}
        </div>
      </section>

      <section className="game-section">
        <div className="game-section-heading"><div><span className="section-kicker">Um só território</span><h2>10 zonas da Madeira</h2></div><span className="game-counter">{stats.exploredZones}/10 exploradas localmente</span></div>
        <p className="game-muted">O mapa jogável limita-se à ilha da Madeira. Porto Santo e outras regiões não fazem parte deste jogo.</p>
        <div className="game-zones-grid">
          {stats.zones.map((zone) => <article className={`game-zone ${zone.explored ? 'is-explored' : ''}`} key={zone.id}>
            <span className="zone-marker">{zone.explored ? <Check size={15} /> : <MapPin size={15} />}</span>
            <div><strong>{zone.name}</strong><small>{zone.description}</small></div>
            <span className="zone-state">{zone.explored ? 'Explorada localmente' : 'Por explorar'}</span>
          </article>)}
        </div>
      </section>

      <section className="game-section game-activity-section">
        <div className="game-section-heading"><div><span className="section-kicker">Escolhe o teu estilo</span><h2>Quatro modalidades</h2></div></div>
        <div className="game-activity-types">{activityTypes.map((type) => {
          const Icon = icons[type.id]
          return <button key={type.id} type="button" onClick={() => onStartActivity(type.id)}><Icon size={19} /><span>{type.label}</span><ChevronRight size={15} /></button>
        })}</div>
      </section>

      <section className="game-section game-global-section">
        <div className="game-section-heading"><div><span className="section-kicker">Modo online</span><h2>Comunidade da Madeira</h2></div><Globe2 size={20} /></div>
        {user ? (
          <div className="game-account-panel">
            <div className="game-account-heading"><span className="game-account-avatar"><UserRound size={18} /></span><div><strong>{user.username}</strong><small>Conta ligada ao servidor</small></div><button type="button" className="game-logout" disabled={busy} onClick={handleLogout}><LogOut size={14} /> Sair</button></div>
            <button type="button" className="game-sync-button" disabled={busy || activities.length === 0} onClick={syncActivities}>{busy ? 'A sincronizar…' : `Sincronizar atividades locais (${activities.length})`}</button>
            <p className="game-muted">A sincronização envia os pontos GPS apenas para validação temporária. O servidor guarda distância, duração e zona, não a rota GPS bruta.</p>
            {globalState && <div className="game-online-stats"><div><span>XP global</span><strong>{globalState.stats.xp}</strong></div><div><span>Atividades válidas</span><strong>{globalState.stats.activities}</strong></div><div><span>Distância validada</span><strong>{formatDistance(globalState.stats.distanceMeters)}</strong></div></div>}
          </div>
        ) : apiStatus === 'checking' ? (
          <div className="game-empty-online">A verificar a ligação ao servidor multiplayer…</div>
        ) : apiStatus === 'offline' ? (
          <div className="game-offline-panel"><ShieldCheck size={20} /><div><strong>Modo global ainda não configurado</strong><p>O jogo local funciona. Para ativar contas, classificações e sincronização, é necessário ligar o serviço web ao PostgreSQL já existente no Railway. Ainda não foi feita qualquer alteração à infraestrutura.</p></div></div>
        ) : (
          <form className="game-auth-form" onSubmit={handleAuth}>
            <div className="game-auth-intro"><LockKeyhole size={18} /><div><strong>Entra no jogo global</strong><p>Cria um nome de jogador e participa na classificação partilhada. A palavra-passe tem de ter pelo menos 12 caracteres.</p></div></div>
            <div className="game-auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Iniciar sessão</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Criar conta</button></div>
            <label>Nome de jogador<input autoComplete="username" minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="ex.: MadeiraExplorer" /></label>
            <label>Palavra-passe<input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} type="password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 12 caracteres" /></label>
            <button className="game-sync-button" type="submit" disabled={busy}>{busy ? 'A processar…' : mode === 'register' ? 'Criar conta' : 'Iniciar sessão'}</button>
          </form>
        )}
        {notice && <p className="game-feedback success" role="status">{notice}</p>}
        {error && <p className="game-feedback error" role="alert">{error}</p>}
        {user && globalState && <>
          <div className="game-section-heading game-board-heading"><div><span className="section-kicker">Jogadores registados</span><h2>Classificação global</h2></div><span className="game-counter">Top 20</span></div>
          {globalState.leaderboard.length ? <div className="game-leaderboard">{globalState.leaderboard.map((player, index) => <div className="game-leaderboard-row" key={player.username}><span className="leaderboard-rank">{index + 1}</span><span className="leaderboard-name">{player.username}{player.username === user.username && <small>Tu</small>}</span><strong>{player.xp} XP</strong><span>{player.activities} atividades</span></div>)}</div> : <div className="game-empty-online">Ainda não existem atividades globais validadas. Sê dos primeiros a explorar.</div>}
          <div className="game-section-heading game-board-heading"><div><span className="section-kicker">Contribuição da comunidade</span><h2>Zonas da ilha</h2></div></div>
          <div className="game-online-zones">{globalState.zones.map((zone) => <div className="game-online-zone" key={zone.id}><div><strong>{zone.name}</strong><small>{zone.activity_count} atividades validadas · {zone.total_xp} XP</small></div><span>{zone.leading_player ? `Líder: ${zone.leading_player}` : 'Sem líder ainda'}</span></div>)}</div>
          <p className="game-muted">{globalState.territoryNote}</p>
        </>}
      </section>

      <div className="game-local-notice"><ShieldCheck size={17} /><div><strong>Privacidade e limites de validação</strong><p>O servidor não guarda as coordenadas GPS brutas. A validação usa limites geográficos e velocidade plausível, mas não elimina totalmente falsificação de GPS. A versão global precisa de testes de segurança e um processo de recuperação de conta antes de ser lançada publicamente.</p></div></div>
      <div className="game-footer"><Trophy size={15} /> MADEIRA QUEST <span>·</span> A ilha é o único tabuleiro.</div>
    </section>
  )
}
