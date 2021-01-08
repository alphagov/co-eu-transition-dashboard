const groupBy = (list, callback) => {
  return list.reduce((acc, x) => {
    const key = callback(x);
    if (!acc[key]) {
      return {
        ...acc,
        [key]: [x]
      }
    }
    return {
      ...acc,
      [key]: [...acc[key], x]
    }

  }, {})
}
module.exports = {
  groupBy
};

