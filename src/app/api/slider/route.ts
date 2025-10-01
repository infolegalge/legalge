import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const slides = await prisma.sliderSlide.findMany({ orderBy: { orderIndex: "asc" } });
    const body = slides.map((s) => ({ light: s.lightUrl, dark: s.darkUrl, lightAlt: s.lightAlt, darkAlt: s.darkAlt }));
    return Response.json(body, {
      headers: {
        // Cache for 1 hour at the edge and allow stale-while-revalidate for 1 day
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error('Slider API error:', error);
    // Return fallback slides if database fails
    const fallbackSlides = [
      { light: "/slider/01lightmtkvari.webp", dark: "/slider/01darkmtkvari.webp" },
      { light: "/slider/02lighcity.webp", dark: "/slider/02darkcity.webp" },
    ];
    return Response.json(fallbackSlides);
  }
}

// export const runtime = "edge"; // Disabled due to Prisma compatibility


