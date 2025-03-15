import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/connectDB';
import { Inventory, StockUpdateParams } from '@/models/inventory';

// GET /api/stock - Get all inventory or filter by brand
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    
    let query = {};
    if (brand) {
      query = { brand };
    }

    const inventory = await Inventory.find(query);
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/stock - Add new inventory item or update existing
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body: StockUpdateParams = await request.json();
    const { brand, size, category, quantity, action } = body;

    // Validate required fields
    if (!brand || !size || !category || !quantity || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find existing inventory item or create new one
    let inventoryItem = await Inventory.findOne({ brand });
    
    if (!inventoryItem) {
      inventoryItem = new Inventory({
        brand,
        sizes: [],
        totalQuantity: 0
      });
    }

    // Update the stock
    await inventoryItem.updateStock(size, category, quantity, action);

    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
