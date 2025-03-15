import { connectToDatabase } from '../utils/connectDB';
import { Inventory } from '../models/inventory';

const brands = ["Gildan", "Bella+Canvas", "Hanes", "Nike"];
const adultSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const youthSizes = ["XS", "S", "M", "L", "XL"].map(size => `Y${size}`);

async function seedDatabase() {
  try {
    await connectToDatabase();
    
    // Clear existing data
    await Inventory.deleteMany({});
    
    // Create initial inventory for each brand
    const inventoryPromises = brands.map(async (brand) => {
      const sizes = [
        // Adult sizes
        ...adultSizes.map(size => ({
          size,
          quantity: Math.floor(Math.random() * 50), // Random initial stock between 0-50
          category: 'adult'
        })),
        // Youth sizes
        ...youthSizes.map(size => ({
          size: size.substring(1), // Remove Y prefix for storage
          quantity: Math.floor(Math.random() * 30), // Random initial stock between 0-30
          category: 'youth'
        }))
      ];

      const inventory = new Inventory({
        brand,
        sizes,
        totalQuantity: sizes.reduce((total, size) => total + size.quantity, 0)
      });

      return inventory.save();
    });

    await Promise.all(inventoryPromises);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 