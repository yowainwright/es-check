const items = [
  { type: 'fruit', name: 'apple' },
  { type: 'vegetable', name: 'carrot' },
  { type: 'fruit', name: 'banana' },
];

const grouped = items.group(item => item.type);
const groupedMap = items.groupToMap(item => item.type);
