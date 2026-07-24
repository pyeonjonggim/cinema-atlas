import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const artifactRoot = path.join(repoRoot, "data", "imports", "saved-journeys");
const files = {
  saveButton: path.join(repoRoot, "components", "journey", "SaveJourneyButton.tsx"),
  savedShelf: path.join(repoRoot, "components", "journey", "SavedJourneyShelf.tsx"),
  journeyLibraryPage: path.join(repoRoot, "app", "explore", "journeys", "page.tsx"),
  myPage: path.join(repoRoot, "app", "my", "page.tsx"),
  myAtlasPage: path.join(repoRoot, "components", "pages", "MyAtlasDashboardPage.tsx"),
  passportPage: path.join(repoRoot, "components", "pages", "MyPassportPage.tsx"),
};

async function main() {
  const sources = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(async ([key, filePath]) => [
        key,
        await fs.readFile(filePath, "utf8"),
      ])
    )
  );
  const checks = [
    {
      name: "shared-storage-key",
      passed:
        sources.saveButton.includes("cinema-atlas:saved-journeys") &&
        sources.savedShelf.includes("cinema-atlas:saved-journeys"),
    },
    {
      name: "change-event-dispatched",
      passed:
        sources.saveButton.includes("saved-journeys-changed") &&
        sources.saveButton.includes("dispatchEvent"),
    },
    {
      name: "shelf-listens-for-changes",
      passed:
        sources.savedShelf.includes("saved-journeys-changed") &&
        sources.savedShelf.includes("addEventListener"),
    },
    {
      name: "shelf-removes-saved-journey",
      passed:
        sources.savedShelf.includes("removeSavedJourney") &&
        sources.savedShelf.includes("Remove"),
    },
    {
      name: "journey-library-renders-saved-shelf",
      passed: sources.journeyLibraryPage.includes("SavedJourneyShelf"),
    },
    {
      name: "my-atlas-renders-saved-shelf",
      passed:
        sources.myPage.includes("listPublishedJourneys") &&
        sources.myAtlasPage.includes("SavedJourneyShelf"),
    },
    {
      name: "passport-does-not-own-saved-shelf",
      passed: !sources.passportPage.includes("SavedJourneyShelf"),
    },
  ];
  const errors = checks
    .filter((check) => !check.passed)
    .map((check) => `Saved Journey check failed: ${check.name}`);
  const summary = {
    checks: checks.length,
    passed: checks.filter((check) => check.passed).length,
    failed: errors.length,
    status: errors.length === 0 ? "PASS" : "FAIL",
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("checks.json", checks);
  await writeArtifact("issues.json", { errors });

  console.log("Saved Journey Verification\n");
  console.log(`Checks: ${summary.checks}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`\nStatus: ${summary.status}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
