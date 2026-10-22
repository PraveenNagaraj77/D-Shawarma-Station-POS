
const mongoose = require("mongoose");
require("dotenv").config();

const Category = require("../src/models/Category");
const MenuItem = require("../src/models/MenuItem");

// --------------------------------------------------
// CATEGORY DATA
// --------------------------------------------------

const categories = [
  {
    name: "Shawarma Rolls",
    description:
      "Explore our classic and flavour-packed shawarma rolls, made for a satisfying meal.",
    sortOrder: 1,
  },
  {
    name: "Jumbo Shawarmas",
    description:
      "Bigger shawarma favourites for those looking for a more filling bite.",
    sortOrder: 2,
  },
  {
    name: "D Special Shawarma Rolls",
    description:
      "Discover our signature shawarma rolls with exciting flavours and extra indulgence.",
    sortOrder: 3,
  },
  {
    name: "D Special Shawarma Plates",
    description:
      "Enjoy our signature shawarma creations served plate-style for a hearty meal.",
    sortOrder: 4,
  },
  {
    name: "Shawarma Plates",
    description:
      "A delicious range of shawarma plates, from classic favourites to loaded creations.",
    sortOrder: 5,
  },
  {
    name: "D Fit Special",
    description:
      "Protein-focused meal options for a filling, fitness-inspired food experience.",
    sortOrder: 6,
  },
  {
    name: "Drinks",
    description:
      "Refresh yourself with cool drinks and refreshing beverage favourites.",
    sortOrder: 7,
  },
  {
    name: "Extras",
    description:
      "Customise your meal with extra sauces, toppings and add-ons.",
    sortOrder: 8,
  },
];

// --------------------------------------------------
// MENU ITEM DATA
// --------------------------------------------------

const menuItems = [
  // 1. Shawarma Rolls — 9 items
  {
    name: "Classic Shawarma Roll",
    description:
      "A timeless shawarma favourite, rolled up for a satisfying and flavourful bite.",
    price: 80,
    category: "Shawarma Rolls",
  },
  {
    name: "Mexican Shawarma Roll",
    description:
      "A bold, Mexican-inspired twist on the classic shawarma roll.",
    price: 90,
    category: "Shawarma Rolls",
  },
  {
    name: "Arabian Shawarma Roll",
    description:
      "An Arabian-inspired shawarma roll for a rich and satisfying meal.",
    price: 100,
    category: "Shawarma Rolls",
  },
  {
    name: "Schezwan Shawarma Roll",
    description:
      "A flavour-packed shawarma roll with a Schezwan-inspired twist.",
    price: 110,
    category: "Shawarma Rolls",
  },
  {
    name: "Moroccan Shawarma Roll",
    description:
      "A Moroccan-inspired take on shawarma with a distinctive flavour profile.",
    price: 110,
    category: "Shawarma Rolls",
  },
  {
    name: "Moroccan Loaded Fries Shawarma Roll",
    description:
      "A loaded shawarma roll combining Moroccan-inspired flavours with a fries twist.",
    price: 130,
    category: "Shawarma Rolls",
  },
  {
    name: "Peri Peri Chicken Shawarma Roll",
    description:
      "A chicken shawarma roll with the bold, zesty character of peri peri seasoning.",
    price: 130,
    category: "Shawarma Rolls",
  },
  {
    name: "Cheese Shawarma Roll",
    description:
      "A delicious shawarma roll with a cheesy twist for extra indulgence.",
    price: 150,
    category: "Shawarma Rolls",
  },
  {
    name: "D Fit Shawarma Roll",
    description:
      "A signature D Fit shawarma roll for a satisfying, fitness-inspired meal.",
    price: 170,
    category: "Shawarma Rolls",
  },

  // 2. Jumbo Shawarmas — 5 items
  {
    name: "Classic Jumbo",
    description:
      "The classic shawarma experience in a jumbo size for a more filling meal.",
    price: 120,
    category: "Jumbo Shawarmas",
  },
  {
    name: "Mexican Jumbo",
    description:
      "A generously sized shawarma with a bold Mexican-inspired flavour twist.",
    price: 130,
    category: "Jumbo Shawarmas",
  },
  {
    name: "Arabian Jumbo",
    description:
      "A jumbo shawarma inspired by the rich flavours of Arabian-style favourites.",
    price: 140,
    category: "Jumbo Shawarmas",
  },
  {
    name: "Schezwan Jumbo",
    description:
      "A jumbo-sized shawarma featuring a punchy Schezwan-inspired flavour.",
    price: 140,
    category: "Jumbo Shawarmas",
  },
  {
    name: "Cheese Jumbo",
    description:
      "A bigger shawarma favourite with a rich, cheesy twist.",
    price: 160,
    category: "Jumbo Shawarmas",
  },

  // 3. D Special Shawarma Rolls — 3 items
  {
    name: "Special Classic Roll",
    description:
      "A D Special take on the classic roll for a more indulgent shawarma experience.",
    price: 120,
    category: "D Special Shawarma Rolls",
  },
  {
    name: "Special Mexican Roll",
    description:
      "Our D Special roll with a bold Mexican-inspired flavour profile.",
    price: 130,
    category: "D Special Shawarma Rolls",
  },
  {
    name: "Special Schezwan Roll",
    description:
      "A signature roll bringing together D Special style and Schezwan-inspired flavour.",
    price: 140,
    category: "D Special Shawarma Rolls",
  },

  // 4. D Special Shawarma Plates — 3 items
  {
    name: "Special Classic Plate",
    description:
      "Our signature take on the classic shawarma, served plate-style.",
    price: 120,
    category: "D Special Shawarma Plates",
  },
  {
    name: "Special Mexican Plate",
    description:
      "A D Special shawarma plate with a bold Mexican-inspired twist.",
    price: 130,
    category: "D Special Shawarma Plates",
  },
  {
    name: "Special Schezwan Plate",
    description:
      "A signature shawarma plate with the distinctive character of Schezwan-inspired flavours.",
    price: 140,
    category: "D Special Shawarma Plates",
  },

  // 5. Shawarma Plates — 8 items
  {
    name: "Classic Plate",
    description:
      "A classic shawarma plate for a satisfying meal beyond the roll.",
    price: 130,
    category: "Shawarma Plates",
  },
  {
    name: "Mexican Plate",
    description:
      "A shawarma plate featuring a bold Mexican-inspired flavour twist.",
    price: 140,
    category: "Shawarma Plates",
  },
  {
    name: "Arabian Plate",
    description:
      "An Arabian-inspired shawarma plate for a rich and flavourful meal.",
    price: 140,
    category: "Shawarma Plates",
  },
  {
    name: "Schezwan Plate",
    description:
      "A flavourful shawarma plate with a Schezwan-inspired kick.",
    price: 140,
    category: "Shawarma Plates",
  },
  {
    name: "Moroccan Plate",
    description:
      "A Moroccan-inspired shawarma plate with a distinctive flavour profile.",
    price: 150,
    category: "Shawarma Plates",
  },
  {
    name: "Moroccan Fries Plate",
    description:
      "A Moroccan-inspired plate with a loaded fries twist for extra enjoyment.",
    price: 160,
    category: "Shawarma Plates",
  },
  {
    name: "Cheese Plate Shawarma",
    description:
      "A hearty shawarma plate with a cheesy twist for extra indulgence.",
    price: 180,
    category: "Shawarma Plates",
  },
  {
    name: "D Fit Shawarma Plate",
    description:
      "A signature D Fit shawarma plate for a filling, fitness-inspired meal.",
    price: 220,
    category: "Shawarma Plates",
  },

  // 6. D Fit Special — 2 items
  {
    name: "Protein Bowl Lite",
    description:
      "A lighter, protein-focused bowl for a simple and satisfying meal.",
    price: 180,
    category: "D Fit Special",
  },
  {
    name: "D Fit Protein Bowl",
    description:
      "A hearty, protein-focused bowl designed for a fitness-inspired food experience.",
    price: 250,
    category: "D Fit Special",
  },

  // 7. Drinks — 6 items
  {
    name: "Soft Drink",
    description:
      "A chilled soft drink to accompany your favourite shawarma meal.",
    price: 50,
    category: "Drinks",
  },
  {
    name: "Fresh Lime Soda",
    description:
      "A refreshing lime soda with a bright, citrus-inspired taste.",
    price: 60,
    category: "Drinks",
  },
  {
    name: "Mint Mojito",
    description:
      "A refreshing mint-inspired drink for a cool and revitalising break.",
    price: 70,
    category: "Drinks",
  },
  {
    name: "Blue Mojito",
    description:
      "A vibrant blue mojito-style drink with a refreshing twist.",
    price: 70,
    category: "Drinks",
  },
  {
    name: "Lemon Mint Mojito",
    description:
      "A refreshing combination of lemon-inspired zest and cool mint flavour.",
    price: 80,
    category: "Drinks",
  },
  {
    name: "Water Bottle",
    description:
      "A convenient bottle of water to keep you refreshed with your meal.",
    price: 20,
    category: "Drinks",
  },

  // 8. Extras — 6 items
  {
    name: "Kabús",
    description:
      "An extra serving of Kabús to complement your favourite meal.",
    price: 15,
    category: "Extras",
  },
  {
    name: "Mayo",
    description:
      "A creamy mayonnaise add-on to customise your meal.",
    price: 20,
    category: "Extras",
  },
  {
    name: "Spicy Mayo",
    description:
      "A spicy mayonnaise add-on for an extra flavourful touch.",
    price: 25,
    category: "Extras",
  },
  {
    name: "Cheese",
    description:
      "Add a cheesy touch to your favourite shawarma or plate.",
    price: 25,
    category: "Extras",
  },
  {
    name: "Peri Peri Seasoning",
    description:
      "A peri peri seasoning add-on for a bold, zesty flavour boost.",
    price: 10,
    category: "Extras",
  },
  {
    name: "Extra Chicken",
    description:
      "Add an extra portion of chicken to make your meal more substantial.",
    price: 60,
    category: "Extras",
  },
];

// --------------------------------------------------
// SEED FUNCTION
// --------------------------------------------------

async function seedMenu() {
  let session;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    if (categories.length !== 8 || menuItems.length !== 42) {
      throw new Error(
        `Unexpected seed data counts: ${categories.length} categories, ` +
        `${menuItems.length} menu items. Expected 8 and 42.`
      );
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "d_shawarma_station",
    });

    console.log("Connected to MongoDB.");

    // Fail safely if any category or menu records already exist.
    const [existingCategories, existingItems] = await Promise.all([
      Category.countDocuments(),
      MenuItem.countDocuments(),
    ]);

    if (existingCategories > 0 || existingItems > 0) {
      throw new Error(
        `Seeding stopped: found ${existingCategories} categories and ` +
        `${existingItems} menu items. No seed records were inserted.`
      );
    }

    // Use a transaction so categories and menu items are committed together.
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const createdCategories = await Category.insertMany(categories, {
        session,
      });

      const categoryIds = new Map(
        createdCategories.map((category) => [
          category.name,
          category._id,
        ])
      );

      const documents = menuItems.map((item) => {
        const categoryId = categoryIds.get(item.category);

        if (!categoryId) {
          throw new Error(
            `Category not found for menu item: ${item.name}`
          );
        }

        return {
          name: item.name,
          description: item.description,
          price: item.price,
          category: categoryId,
          imageUrl: "",
          isAvailable: true,
          isDeleted: false,
        };
      });

      await MenuItem.insertMany(documents, { session });
    });

    const [categoryCount, itemCount] = await Promise.all([
      Category.countDocuments(),
      MenuItem.countDocuments({ isDeleted: false }),
    ]);

    console.log("\nMenu seeding completed successfully!");
    console.log(`Categories created: ${categoryCount}`);
    console.log(`Menu items created: ${itemCount}`);
    console.log("All menu items have descriptions.");
    console.log("Image URLs are empty and can be added later.");
  } catch (error) {
    console.error("\nMenu seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (session) {
      await session.endSession();
    }

    await mongoose.disconnect();
  }
}

seedMenu();
