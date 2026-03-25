import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <article className="card">
          <span className="eyebrow">Beta fechado em preparacao</span>
          <h1 className="headline">
            Rotina infantil com recompensas, acolhimento e o Gau guiando cada
            conquista.
          </h1>
          <p className="lead">
            O Leggau conecta familias, profissionais e operacao tecnica em um
            mesmo ecossistema: app mobile, portal web, web admin e backend
            operando com rastreabilidade e evolucao continua.
          </p>
          <div className="ctaRow">
            <Link className="button primary" href="/download">
              Entrar no beta
            </Link>
            <Link className="button secondary" href="/pais">
              Ver recursos para pais
            </Link>
          </div>
        </article>
        <aside className="card">
          <h2>O que ja estamos montando</h2>
          <div className="grid3">
            <div className="metric">
              <strong>App</strong>
              Android e iOS via Unity com Gau integrado.
            </div>
            <div className="metric">
              <strong>Portal</strong>
              Distribuicao, narrativa institucional e legal.
            </div>
            <div className="metric">
              <strong>Admin</strong>
              Operacao, usuarios, billing e status da VM.
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <h2>Ecossistema Leggau</h2>
        <ul className="list">
          <li>Pais acompanham progresso, atividades e recompensas da crianca.</li>
          <li>Profissionais ganham uma trilha preparada para evolucao futura.</li>
          <li>O time operacional administra usuarios, servicos e cobrancas sandbox.</li>
        </ul>
      </section>
    </>
  );
}
