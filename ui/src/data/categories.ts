export type Category = {
  id: number;
  name: string;
  icon: string;
  subcategories: string[];
};

export const categories: Category[] = [
  {
    id: 1,
    name: "Electronics",
    icon: "devices",
    subcategories: ["Mobile", "Laptop", "Tablet", "Camera", "Accessories"],
  },
  {
    id: 2,
    name: "Vehicles",
    icon: "directions_car",
    subcategories: ["Car", "Bike", "Scooter", "Truck"],
  },
  {
    id: 3,
    name: "Property",
    icon: "real_estate_agent",
    subcategories: ["Apartment", "House", "Land", "Commercial"],
  },
  {
    id: 4,
    name: "Home & Garden",
    icon: "chair",
    subcategories: [
      "Furniture",
      "Appliances",
      "Decoration & Art",
      "Tools & Equipment",
    ],
  },
  {
    id: 5,
    name: "Fashion",
    icon: "apparel",
    subcategories: ["Men", "Women", "Kids", "Footwear"],
  },
  {
    id: 6,
    name: "Toys",
    icon: "toys",
    subcategories: ["Educational", "Outdoor", "Board Games", "Action Figures"],
  },
];
