import { NextResponse } from "next/server";

interface ModrinthGameVersion {
  version: string;
  version_type: "release" | "snapshot" | "beta" | "alpha";
  date: string;
  major: boolean;
}

export async function GET() {
  try {
    const res = await fetch("https://api.modrinth.com/v2/tag/game_version", {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "Minenager-WebBuilder/1.0 (contact@minenager.com)",
      },
    });

    if (!res.ok) {
      throw new Error(`Modrinth API responded with status ${res.status}`);
    }

    const data: ModrinthGameVersion[] = await res.json();

    // Filter release versions supported by Modrinth
    const releases = data
      .filter((v) => v.version_type === "release")
      .map((v) => v.version);

    // Filter out test tags / pre-releases and maintain valid semver release versions
    const supportedReleases = releases.filter((ver) => {
      const match = ver.match(/^1\.(\d+)(?:\.(\d+))?$/);
      if (!match) return false;
      const minor = parseInt(match[1], 10);
      const patch = match[2] ? parseInt(match[2], 10) : 0;
      if (minor < 12) return false; // Modern versions (1.12+)
      if (minor === 21 && patch > 4) return false; // Guard against Modrinth preview tags > 1.21.4
      return true;
    });

    const majorVersions = [
      "1.21.4",
      "1.21.3",
      "1.21.2",
      "1.21.1",
      "1.21",
      "1.20.6",
      "1.20.4",
      "1.20.2",
      "1.20.1",
      "1.20",
      "1.19.4",
      "1.19.3",
      "1.19.2",
      "1.19.1",
      "1.19",
      "1.18.2",
      "1.18.1",
      "1.18",
      "1.17.1",
      "1.16.5",
      "1.12.2",
    ];

    const resultList = supportedReleases.length > 0 ? supportedReleases : majorVersions;

    return NextResponse.json({
      latest: resultList[0] || "1.21.4",
      featured: majorVersions,
      versions: resultList,
      all: resultList,
    });
  } catch (error) {
    const fallbackList = [
      "1.21.4",
      "1.21.3",
      "1.21.2",
      "1.21.1",
      "1.21",
      "1.20.6",
      "1.20.4",
      "1.20.2",
      "1.20.1",
      "1.20",
      "1.19.4",
      "1.19.3",
      "1.19.2",
      "1.18.2",
      "1.16.5",
      "1.12.2",
    ];

    return NextResponse.json({
      latest: "1.21.4",
      featured: fallbackList,
      versions: fallbackList,
      all: fallbackList,
    });
  }
}
