import { NextResponse } from "next/server";

interface MojangVersion {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
}

interface MojangManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MojangVersion[];
}

export async function GET() {
  try {
    const res = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", {
      next: { revalidate: 3600 }, // cache for 1 hour
      headers: { "User-Agent": "Minenager/1.0" },
    });

    if (!res.ok) {
      throw new Error(`Mojang API responded with status ${res.status}`);
    }

    const data: MojangManifest = await res.json();
    const releases = data.versions
      .filter((v) => v.type === "release")
      .map((v) => v.id);

    // Curated major versions to present prominently
    const majorVersions = [
      "1.21.4",
      "1.21.1",
      "1.20.4",
      "1.20.1",
      "1.19.4",
      "1.19.2",
      "1.18.2",
      "1.16.5",
      "1.12.2",
    ];

    return NextResponse.json({
      latest: data.latest.release,
      featured: majorVersions,
      all: releases.slice(0, 30),
    });
  } catch (error) {
    // Fallback list if external network error
    return NextResponse.json({
      latest: "1.21.4",
      featured: ["1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.2", "1.18.2"],
      all: ["1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.4", "1.19.2", "1.18.2"],
    });
  }
}
