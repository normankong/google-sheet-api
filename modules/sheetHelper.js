const _ = require("lodash");

function getFieldMask(obj) {
  return _.keys(obj).join(",");
}

function columnToLetter(column) {
  let temp;
  let letter = "";
  let col = column;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

function letterToColumn(letter) {
  let column = 0;
  const { length } = letter;
  for (let i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * 26 ** (length - i - 1);
  }
  return column;
}

function trimObjectSpace(obj) {
  if (Array.isArray(obj)) {
    return obj.map(createObject);
  } else {
    return createObject(obj);
  }
}

const createObject = (obj) => {
  var newObj = {};
  for (var key in obj) {
    newObj[key.trim()] = obj[key];
  }
  return newObj;
};

module.exports = {
  getFieldMask,
  columnToLetter,
  letterToColumn,
  trimObjectSpace,
};
