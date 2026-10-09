import { Activity, Bike, Check, ChevronRight, Footprints, Flag, MapPin, Mountain, ShieldCheck, Sparkles, Target, Trophy, Zap } from 'lucide-react'
import { activityTypes, getGameStats } from '../game/gameEngine.js'

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

const icons = { walking: Footprints, running: Activity, cycling: Bike, hiking: Mountain }

export default function GameHub({ activities, onStartActivity }) {
  const stats = getGameStats(activities)
  return (
    <section className="game-page subpage">
      <div className="game-hero">
        <div className="game-hero-copy">
          <span className="game-eyebrow"><Sparkles size={13} /> MADEIRA QUEST · TEMPORADA ZERO</span>
          <h1>A ilha é o teu mundo de jogo.</h1>
          <p>Move-te na Madeira. Completa missões. Sobe de nível. Ajuda a tua comunidade a explorar a ilha.</p>
          <button type="button" className="game-start-button" onClick={() => onStartActivity()}>Começar atividade <ChevronRight size={16} /></button>
        </div>
        <div className="game-level-orb"><span>NÍVEL</span><strong>{stats.level}</strong><small>{stats.xp} XP</small></div>
      </div>

      <div className="game-stats-grid">
        <article><span className="game-stat-icon"><Zap size={16} /></span><span>Experiência</span><strong>{stats.xp} <small>XP</small></strong></article>
        <article><span className="game-stat-icon"><Footprints size={16} /></span><span>Atividades</span><strong>{stats.totalActivities}</strong></article>
        <article><span className="game-stat-icon"><Flag size={16} /></span><span>Trilhos registados</span><strong>{stats.totalTrails}</strong></article>
      </div>

      <section className="game-section">
        <div className="game-section-heading"><div><span className="section-kicker">A tua progressão</span><h2>Nível {stats.level} · Explorador da Madeira</h2></div><span className="game-xp-label">{stats.xpIntoLevel}/250 XP</span></div>
        <div className="game-progress"><span style={{ width: `${stats.levelProgress}%` }} /></div>
        <p className="game-muted">Cada 100 metros contam para a experiência. Atividades concluídas e novos trilhos dão bónus.</p>
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
        <div className="game-section-heading"><div><span className="section-kicker">Um só território</span><h2>10 zonas da Madeira</h2></div><span className="game-counter">{stats.exploredZones}/10 exploradas</span></div>
        <p className="game-muted">O mapa jogável limita-se à ilha da Madeira. Porto Santo e outras regiões não fazem parte deste jogo.</p>
        <div className="game-zones-grid">
          {stats.zones.map((zone) => <article className={`game-zone ${zone.explored ? 'is-explored' : ''}`} key={zone.id}>
            <span className="zone-marker">{zone.explored ? <Check size={15} /> : <MapPin size={15} />}</span>
            <div><strong>{zone.name}</strong><small>{zone.description}</small></div>
            <span className="zone-state">{zone.explored ? 'Explorada' : 'Por explorar'}</span>
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

      <div className="game-local-notice"><ShieldCheck size={17} /><div><strong>Protótipo local — não é ainda multiplayer global</strong><p>O XP, as missões e as zonas exploradas são calculados neste dispositivo. Para partilhar territórios e classificações entre todos os jogadores será necessário implementar contas, sincronização e validação no servidor. Não inventamos jogadores nem classificações.</p></div></div>
      <div className="game-footer"><Trophy size={15} /> MADEIRA QUEST <span>·</span> A ilha é o único tabuleiro.</div>
    </section>
  )
}
