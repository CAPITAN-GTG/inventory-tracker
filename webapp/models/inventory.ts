import mongoose, { Schema, Document, CallbackWithoutResultAndOptionalError } from 'mongoose';

// Interfaces for TypeScript type checking
export interface ISize {
  size: string;
  quantity: number;
  category: 'adult' | 'youth';
}

export interface IInventoryItem extends Document {
  brand: string;
  sizes: ISize[];
  totalQuantity: number;
  lastUpdated: Date;
  createdAt: Date;
}

// Schema for size tracking
const SizeSchema = new Schema<ISize>({
  size: {
    type: String,
    required: true,
    enum: [
      // Adult sizes
      'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL',
      // Youth sizes (with Y prefix)
      'YXS', 'YS', 'YM', 'YL', 'YXL'
    ]
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['adult', 'youth']
  }
});

// Main inventory schema
const InventorySchema = new Schema<IInventoryItem>({
  brand: {
    type: String,
    required: true,
    enum: ['Gildan', 'Bella+Canvas', 'Hanes', 'Nike'],
    index: true
  },
  sizes: [SizeSchema],
  totalQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true }
});

// Middleware to update totalQuantity before saving
InventorySchema.pre('save', function(next: CallbackWithoutResultAndOptionalError) {
  const doc = this as IInventoryItem;
  doc.totalQuantity = doc.sizes.reduce((total: number, size: ISize) => total + size.quantity, 0);
  doc.lastUpdated = new Date();
  next();
});

// Virtual for getting adult sizes only
InventorySchema.virtual('adultSizes').get(function(this: IInventoryItem) {
  return this.sizes.filter(size => size.category === 'adult');
});

// Virtual for getting youth sizes only
InventorySchema.virtual('youthSizes').get(function(this: IInventoryItem) {
  return this.sizes.filter(size => size.category === 'youth');
});

// Instance method to update stock
InventorySchema.methods.updateStock = async function(
  size: string,
  category: 'adult' | 'youth',
  quantity: number,
  action: 'add' | 'remove'
) {
  const sizeIndex = this.sizes.findIndex(
    (s: ISize) => s.size === size && s.category === category
  );

  if (sizeIndex === -1) {
    // Size doesn't exist, create it
    this.sizes.push({
      size,
      category,
      quantity: action === 'add' ? quantity : 0
    });
  } else {
    // Update existing size
    const currentQty = this.sizes[sizeIndex].quantity;
    this.sizes[sizeIndex].quantity = action === 'add'
      ? currentQty + quantity
      : Math.max(0, currentQty - quantity);
  }

  // Save the document
  return this.save();
};

// Static method to get inventory summary
InventorySchema.statics.getInventorySummary = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$brand',
        totalQuantity: { $sum: '$totalQuantity' },
        itemCount: { $sum: 1 }
      }
    }
  ]);
};

// Create indexes
InventorySchema.index({ brand: 1, 'sizes.size': 1, 'sizes.category': 1 });

// Export the model
export const Inventory = mongoose.models.Inventory || mongoose.model<IInventoryItem>('Inventory', InventorySchema);

// Type for inventory updates
export type StockUpdateParams = {
  brand: string;
  size: string;
  category: 'adult' | 'youth';
  quantity: number;
  action: 'add' | 'remove';
};
