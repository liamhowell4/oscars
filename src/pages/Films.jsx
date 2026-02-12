import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBallot } from '../contexts/BallotContext';

const ACTING_CATEGORIES = ['best-actor', 'best-actress', 'best-supporting-actor', 'best-supporting-actress'];
const DIRECTOR_CATEGORY = 'best-director';
const SONG_CATEGORY = 'best-original-song';

export default function Films() {
  const { categories } = useBallot();
  const navigate = useNavigate();

  const filmMap = useMemo(() => {
    const map = {};

    for (const cat of categories) {
      for (const nom of cat.nominees) {
        const filmName = nom.film || nom.title;
        if (!map[filmName]) {
          map[filmName] = [];
        }

        let label = cat.name;
        if (ACTING_CATEGORIES.includes(cat.id) || cat.id === DIRECTOR_CATEGORY) {
          label = `${cat.name} (${nom.title})`;
        } else if (cat.id === SONG_CATEGORY) {
          label = `${cat.name} (${nom.title})`;
        }

        map[filmName].push({ categoryId: cat.id, label });
      }
    }

    return map;
  }, [categories]);

  const sortedFilms = useMemo(() => {
    return Object.entries(filmMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, noms]) => ({ name, noms }));
  }, [filmMap]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="deco-divider mb-6">
          <span className="text-gold/50 text-xs">★</span>
        </div>
        <h2 className="text-4xl font-display text-gold-gradient mb-3">Nominated Films</h2>
        <p className="text-cream/40 font-body text-sm">
          {sortedFilms.length} films across {categories.length} categories
        </p>
      </div>

      {/* Film Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sortedFilms.map((film, i) => (
          <div
            key={film.name}
            className="card-deco p-5 animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
          >
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-lg font-display text-gold-light leading-tight">
                {film.name}
              </h3>
              <span className="text-xs text-cream/30 font-body whitespace-nowrap">
                {film.noms.length} nom{film.noms.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {film.noms.map((nom) => (
                <button
                  key={nom.categoryId + nom.label}
                  onClick={() => navigate(`/ballot?category=${nom.categoryId}`)}
                  className="btn-outline text-xs px-2.5 py-1 font-body hover:bg-gold/10 transition-colors duration-200"
                >
                  {nom.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
