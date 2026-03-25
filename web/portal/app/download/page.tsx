const distribution = [
  {
    title: 'Android beta',
    description: 'Distribuicao prevista por Firebase App Distribution.',
  },
  {
    title: 'iOS beta',
    description: 'Distribuicao prevista por TestFlight.',
  },
];

export default function DownloadPage() {
  return (
    <section className="card">
      <h1>Download e distribuicao</h1>
      <div className="grid3">
        {distribution.map((item) => (
          <article key={item.title} className="metric">
            <strong>{item.title}</strong>
            {item.description}
          </article>
        ))}
      </div>
    </section>
  );
}
