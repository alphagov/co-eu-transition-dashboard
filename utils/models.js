const transformForView = model => {
  return Object.keys(model.rawAttributes)
    .map(attributeKey => Object.assign({}, model.rawAttributes[attributeKey], { value: model[attributeKey] }))
    .filter(attribute => attribute.displayName)
    .map(attribute => {
      return {
        id: attribute.fieldName,
        name: attribute.displayName,
        value: attribute.value
      }
    });
};

const parseFieldEntryValue = (value, fieldDefinition) => {
  if(fieldDefinition) {
    switch(fieldDefinition.get('type')) {
      case 'boolean':
        value = value === '1';
        break;
      case 'integer':
        value = parseInt(value);
        break;
      case 'float':
        value = parseFloat(value);
        break;
    }
    return value;
  }
};

module.exports = {
  transformForView,
  parseFieldEntryValue
};