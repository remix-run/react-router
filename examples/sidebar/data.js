var data = [
  {
    name: 'Tacos',
    items: [
      { name: 'Carne Asada', price: 7 },
      { name: 'Pollo', price: 6 },
      { name: 'Carnitas', price: 6 }
    ]
  },
  {
    name: 'Burgers',
    items: [
      { name: 'Buffalo Bleu', price: 8 },
      { name: 'Bacon', price: 8 },
      { name: 'Mushroom and Swiss', price: 6 }
    ]
  },
  {
    name: 'Drinks',
    items: [
      { name: 'Lemonade', price: 3 },
      { name: 'Root Beer', price: 4 },
      { name: 'Iron Port', price: 5 }
    ]
  }
];

var dataMap = data.reduce(function (map, category) {
  category.itemsMap = category.items.reduce(function (itemsMap, item) {
    itemsMap[item.name] = item;
    return itemsMap;
  }, {});
  map[category.name] = category;
  return map;
}, {});

exports.getAll = function () {
  return data;
};

exports.lookupCategory = function (name) {
  return dataMap[name];
};

exports.lookupItem = function (category, item) {
  return dataMap[category].itemsMap[item];
};

