const nominees = require("./nominees2026.json");

// Build lookup maps for efficient querying
const categoriesById = new Map();
const nomineesByFilm = new Map();
const nomineesById = new Map();

for (const category of nominees.categories) {
  categoriesById.set(category.id, category);

  for (const nominee of category.nominees) {
    // Map nominee ID to { nominee, category }
    nomineesById.set(nominee.id, { nominee, category });

    // Map film name (lowercase) to array of { nominee, category }
    const filmKey = nominee.film.toLowerCase();
    if (!nomineesByFilm.has(filmKey)) {
      nomineesByFilm.set(filmKey, []);
    }
    nomineesByFilm.get(filmKey).push({ nominee, category });
  }
}

/**
 * Search nominees by free-text query. Matches against category names,
 * nominee titles, film names, and info fields.
 */
function searchNominees(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const results = [];
  const seen = new Set();

  for (const category of nominees.categories) {
    if (category.name.toLowerCase().includes(q)) {
      results.push({
        categoryId: category.id,
        categoryName: category.name,
        nominees: category.nominees,
      });
      seen.add(category.id);
      continue;
    }

    const matched = category.nominees.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.film.toLowerCase().includes(q) ||
        n.info.toLowerCase().includes(q)
    );

    if (matched.length > 0 && !seen.has(category.id)) {
      results.push({
        categoryId: category.id,
        categoryName: category.name,
        nominees: matched,
      });
    }
  }

  return results;
}

/**
 * Get a category by its exact ID.
 */
function getCategoryById(categoryId) {
  return categoriesById.get(categoryId) || null;
}

module.exports = {
  nominees,
  categoriesById,
  nomineesByFilm,
  nomineesById,
  searchNominees,
  getCategoryById,
};
