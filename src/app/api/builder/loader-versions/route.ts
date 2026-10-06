import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const loader = (searchParams.get("loader") || "fabric").toLowerCase();
  const version = searchParams.get("version") || "1.20.1";

  if (loader === "vanilla") {
    return NextResponse.json({
      loader: "vanilla",
      versions: ["Official Mojang Release"],
      recommended: "Official Mojang Release",
    });
  }

  // 1. Fabric Loader Versions
  if (loader === "fabric") {
    try {
      const res = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`, {
        headers: { "User-Agent": "Minenager/1.0" },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list = data
            .map((item: any) => item.loader?.version)
            .filter((v: any) => typeof v === "string")
            .slice(0, 8);

          return NextResponse.json({
            loader: "fabric",
            versions: list,
            recommended: list[0] || "0.16.10",
          });
        }
      }
    } catch (err) {
      console.error("Fabric loader versions fetch error:", err);
    }

    return NextResponse.json({
      loader: "fabric",
      versions: ["0.16.10 (Latest)", "0.16.9", "0.16.5", "0.15.11"],
      recommended: "0.16.10 (Latest)",
    });
  }

  // 2. Quilt Loader Versions
  if (loader === "quilt") {
    try {
      const res = await fetch(`https://meta.quiltmc.org/v3/versions/loader/${version}`, {
        headers: { "User-Agent": "Minenager/1.0" },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list = data
            .map((item: any) => item.loader?.version)
            .filter((v: any) => typeof v === "string")
            .slice(0, 8);

          return NextResponse.json({
            loader: "quilt",
            versions: list,
            recommended: list[0] || "0.27.0",
          });
        }
      }
    } catch (err) {
      console.error("Quilt loader versions fetch error:", err);
    }

    return NextResponse.json({
      loader: "quilt",
      versions: ["0.27.1 (Latest)", "0.27.0", "0.26.1", "0.25.0"],
      recommended: "0.27.1 (Latest)",
    });
  }

  // 3. NeoForge
  if (loader === "neoforge") {
    const vPrefix = version.split(".").slice(1).join(".") || "20.4";
    const recommended = `${vPrefix}.237 (Recommended)`;
    return NextResponse.json({
      loader: "neoforge",
      versions: [recommended, `${vPrefix}.236`, `${vPrefix}.220`, `${vPrefix}.100`],
      recommended,
    });
  }

  // 4. Forge
  if (loader === "forge") {
    return NextResponse.json({
      loader: "forge",
      versions: [
        "47.3.0 (Recommended)",
        "47.3.1 (Latest)",
        "47.2.20",
        "47.1.0",
      ],
      recommended: "47.3.0 (Recommended)",
    });
  }

  // 5. Paper
  if (loader === "paper") {
    return NextResponse.json({
      loader: "paper",
      versions: [
        "Latest Build (Auto-Update / Recommended)",
        "Build #496 (Stable)",
        "Build #480",
      ],
      recommended: "Latest Build (Auto-Update / Recommended)",
    });
  }

  return NextResponse.json({
    loader,
    versions: ["Latest Build (Recommended)"],
    recommended: "Latest Build (Recommended)",
  });
}
