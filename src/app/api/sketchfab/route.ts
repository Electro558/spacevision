import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const url = `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true&sort_by=-likeCount&count=12`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sketchfab API error: ${res.status}`);
    const data = await res.json();

    // Extract just what we need
    const results = (data.results || []).map((model: any) => ({
      uid: model.uid,
      name: model.name,
      thumbnail: model.thumbnails?.images?.[0]?.url || '',
      viewerUrl: model.viewerUrl,
      user: model.user?.displayName || 'Unknown',
      likeCount: model.likeCount || 0,
      downloadUrl: model.archives?.glb?.url || null,
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
