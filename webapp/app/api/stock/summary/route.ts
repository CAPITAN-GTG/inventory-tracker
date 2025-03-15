import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/connectDB';
import { Inventory } from '@/models/inventory';

// GET /api/stock/summary - Get inventory summary
export async function GET() {
  try {
    await connectToDatabase();
    const summary = await Inventory.aggregate([
      {
        $group: {
          _id: '$brand',
          totalQuantity: { $sum: '$totalQuantity' },
          itemCount: { $sum: 1 }
        }
      }
    ]);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory summary' },
      { status: 500 }
    );
  }
} 