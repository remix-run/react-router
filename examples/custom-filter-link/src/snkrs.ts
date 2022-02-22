interface Sneaker {
  id: string;
  colorway: string;
  imageUrl: string;
  model: string;
  brand: string;
}

let SNEAKERS: Sneaker[] = [
  {
    id: "1",
    colorway: "Pine Green",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/bkkj0lqzlwlwdwtofqxs",
    model: "Blazer Low 77 Vintage",
    brand: "Nike",
  },
  {
    id: "2",
    colorway: "Reverse Infrared",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/RPlzC_CBHjiMM4dr90gdU",
    model: "Air Max 90",
    brand: "Nike",
  },
  {
    id: "3",
    colorway: "White/Black/Desert",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/0bf9336b-03c9-4cbd-b482-f4e80b770582",
    model: "Court Legacy",
    brand: "Nike",
  },
  {
    id: "5",
    colorway: "Beluga 2.0",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/irxakb1ij0uzmcvn9szo",
    model: "Yeezy 350 v2",
    brand: "Adidas",
  },
  {
    id: "6",
    colorway: "Pumpkin Spice",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/g9tjjjdn476nhou1c1dj",
    model: "Grid SD",
    brand: "Saucony",
  },
  {
    id: "7",
    colorway: "Golden Coast",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/erg1lxa8x29h1wtbog9a",
    model: "Checkerboard Slip-On",
    brand: "Vans",
  },
  {
    id: "8",
    colorway: "Have a Nike Day",
    imageUrl:
      "https://images.mcan.sh/b_auto,c_pad,f_auto,h_400,q_auto,w_400/v1/shoes/u4z27k4wyzr7bxatlfgj",
    model: "Air Max 1",
    brand: "Nike",
  },
];

function filterByBrand(brand: string) {
  return SNEAKERS.filter(
    (sneaker) => sneaker.brand.toLowerCase() === brand.toLowerCase()
  );
}

function getSneakerById(id: string) {
  return SNEAKERS.find((sneaker) => sneaker.id === id);
}

let brands = [...new Set(SNEAKERS.map((sneaker) => sneaker.brand))];

export { brands, SNEAKERS, filterByBrand, getSneakerById };
