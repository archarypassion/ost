import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ToolHistory from '@/models/ToolHistory';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Simulate fetching the URL (In a real app, use fetch or axios and parse HTML)
    // Here we will just simulate a response for demonstration purposes
    const hasNoindex = Math.random() > 0.5;
    const robotsContent = hasNoindex ? 'noindex, nofollow' : 'index, follow';
    const xRobotsTag = hasNoindex ? 'noindex' : null;

    const result = {
      url,
      hasNoindex,
      robotsContent,
      xRobotsTag,
    };

    // Save to database
    await ToolHistory.create({
      url,
      toolName: 'Noindex Tag Checker',
      result,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
