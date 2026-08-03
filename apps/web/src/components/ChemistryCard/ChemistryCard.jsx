const KIND_LABEL = {
  teammates: "Teammates",
  clubmates: "Clubmates",
  countrymen: "Countrymen",
};

export function ChemistryCard({ chemistry }) {
  return (
    <section className="chemistry-card">
      <h3 className="challenges__heading">
        Squad chemistry
        <span className="challenges__score">{chemistry.score}/100</span>
      </h3>
      {chemistry.highlights.length === 0 ? (
        <p className="chemistry-card__empty">
          No real connections in this XI — every player came from a different club and country.
        </p>
      ) : (
        <ul className="chemistry-card__list">
          {chemistry.highlights.map((link, i) => (
            <li key={i} className={`chemistry-link chemistry-link--${link.kind}`}>
              <span className="chemistry-link__kind">{KIND_LABEL[link.kind]}</span>
              <span className="chemistry-link__names">
                {link.playerAName} &amp; {link.playerBName}
              </span>
              <span className="chemistry-link__detail">{link.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
