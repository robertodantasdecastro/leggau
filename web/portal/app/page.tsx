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
            <Link className="button primary" href="/pais">
              Area de pais
            </Link>
            <Link className="button secondary" href="/profissionais">
              Area profissional
            </Link>
          </div>
        </article>
        <aside className="card">
          <h2>O que ja esta ativo no beta tecnico</h2>
          <div className="grid3">
            <div className="metric">
              <strong>App</strong>
              Android e iOS via Unity com Gau integrado.
            </div>
            <div className="metric">
              <strong>Adultos</strong>
              Shell web/PWA com consentimentos, familia e equipe de cuidado.
            </div>
            <div className="metric">
              <strong>Admin</strong>
              Operacao, provedores Google/Apple, seguranca e status da VM.
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <h2>Ecossistema Leggau</h2>
        <ul className="list">
          <li>Pais agora ja podem entrar por senha ou login rapido e seguir a trilha legal antes do cadastro dos menores.</li>
          <li>Profissionais localizam familias, pedem vinculo clinico e ficam sujeitos a aprovacao dupla.</li>
          <li>O admin governa provedores de identidade, jobs de verificacao e a saude da plataforma.</li>
        </ul>
      </section>
    </>
  );
}
