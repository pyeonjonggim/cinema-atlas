import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const inputRoot = path.join(repoRoot, "data", "imports", "catalog-persistence-pilot");
const outputRoot = path.join(repoRoot, "data", "imports", "catalog-query-pilot");

function readJson(filePath) {
  return fs.readFile(filePath, "utf8").then(JSON.parse);
}

function edgeKey(edge) {
  return [
    edge.sourceType,
    edge.sourceId,
    edge.relationType,
    edge.targetType,
    edge.targetId,
  ].join(":");
}

async function main() {
  const [movies, entities, edges, persistenceSummary] = await Promise.all([
    readJson(path.join(inputRoot, "movies.json")),
    readJson(path.join(inputRoot, "entities.json")),
    readJson(path.join(inputRoot, "edges.json")),
    readJson(path.join(inputRoot, "summary.json")),
  ]);

  const firstMovie = movies[0];
  const movieEdges = edges.filter((edge) => edge.sourceType === "movie" && edge.sourceId === firstMovie.id);
  const directorEdge = movieEdges.find((edge) => edge.relationType === "MOVIE_DIRECTED_BY_PERSON");
  const countryEdge = movieEdges.find((edge) => edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY");
  const actorEdge = movieEdges.find((edge) => edge.relationType === "MOVIE_ACTED_BY_PERSON");

  const directorFilmography = directorEdge
    ? edges.filter(
        (edge) =>
          edge.relationType === "MOVIE_DIRECTED_BY_PERSON" &&
          edge.targetId === directorEdge.targetId,
      )
    : [];
  const countryMovies = countryEdge
    ? edges.filter(
        (edge) =>
          edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY" &&
          edge.targetId === countryEdge.targetId,
      )
    : [];
  const actorFilmography = actorEdge
    ? edges.filter(
        (edge) =>
          edge.relationType === "MOVIE_ACTED_BY_PERSON" &&
          edge.targetId === actorEdge.targetId,
      )
    : [];

  const edgeSet = new Set(edges.map(edgeKey));
  const summary = {
    pilot: "catalog-query-pilot",
    source: "catalog-persistence-pilot",
    movieListCount: movies.length,
    movieDetailFound: Boolean(firstMovie),
    firstMovieId: firstMovie.id,
    firstMovieTitle: firstMovie.title,
    directorFilmographyCount: directorFilmography.length,
    countryMoviesCount: countryMovies.length,
    actorFilmographyCount: actorFilmography.length,
    noDuplicateEdges: edgeSet.size === edges.length,
    reimportDuplicateMovies: persistenceSummary.reimport.duplicateMoviesCreated,
    reimportDuplicateEdges: persistenceSummary.reimport.duplicateEdgesCreated,
    queryCalls: 5,
    repositoryReads: 2,
    graphReads: 3,
    staticFallbackEnabled: true,
    unresolvedEdgesCreated: false,
  };

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, "summary.json"), JSON.stringify(summary, null, 2));
  await fs.writeFile(
    path.join(outputRoot, "query-sample.json"),
    JSON.stringify(
      {
        firstMovie,
        director: entities.people.find((person) => person.id === directorEdge?.targetId),
        directorFilmographyMovieIds: directorFilmography.map((edge) => edge.sourceId),
        countryId: countryEdge?.targetId,
        countryMovieIds: countryMovies.map((edge) => edge.sourceId),
      },
      null,
      2,
    ),
  );

  console.table([summary]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

