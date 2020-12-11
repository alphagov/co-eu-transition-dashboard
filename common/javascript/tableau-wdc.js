/* eslint-disable no-undef */

const getTableauDataType = type => {
  switch (type) {
  case 'string':
    return tableau.dataTypeEnum.string
  case 'float':
    return tableau.dataTypeEnum.float
  case 'int':
    return tableau.dataTypeEnum.int
  case 'timestamp':
    return tableau.dataTypeEnum.datetime
  case 'bool':
    return tableau.dataTypeEnum.bool
  default:
    return tableau.dataTypeEnum.string
  }
}

// Tableau only allows the following regex items to be used as an ID
const formatKey = key => key.replace(/[^a-zA-Z0-9_]/g, '');

(function() {
  // Create the connector object
  var myConnector = tableau.makeConnector();

  // Define the schema
  myConnector.getSchema = function (schemaCallback) {
    if(!tableau.connectionData || !tableau.connectionData.length) {
      throw new Error('Data is not valid');
    }
    var cols = [];
    for (const [key, value] of Object.entries(tableau.connectionData[0])) {
      cols.push({
        id: formatKey(key),
        dataType: getTableauDataType(value.type),
        alias: key
      });
    }

    var tableSchema = {
      id: `${formatKey(tableau.connectionName)}feed`,
      alias: `${tableau.connectionName} feed`,
      columns: cols
    };

    schemaCallback([tableSchema]);
  };

  myConnector.getData = function (table, doneCallback) {
    if(!tableau.connectionData || ! tableau.connectionData.length) {
      throw new Error('Data is not valid');
    }

    var tableData = [];

    for (var i = 0, len = tableau.connectionData.length; i < len; i++) {
      const tableEntry = {};
      for (const [key, entryValue] of Object.entries(tableau.connectionData[i])) {
        tableEntry[formatKey(key)] = entryValue.value !== undefined ? entryValue.value : entryValue
      }
      tableData.push(tableEntry);
    }

    table.appendRows(tableData);
    doneCallback();
  };

  tableau.registerConnector(myConnector);

  // Currently setup so no user interaction is needed
  // $(document).ready(function () {
  //   $("#SubmitButton").click(function () {
  //     tableau.connectionData = $("#ConnectionURL").val();
  //     tableau.connectionName = $("#ConnectionName").val();
  //     tableau.submit();
  //   });
  // });

  const validateResponse = response => {
    // validate response
    if (!response || !response.length) {
      throw new Error('No data returned');
    }

    // validate first item for data issues
    const item = response[0];
    if(!item.hasOwnProperty('Public ID')) {
      throw new Error('Missing columns in response');
    }

    if(!item['Public ID'].value.length) {
      throw new Error('Missing data in response');
    }
  };

  myConnector.init = function(initCallback) {
    const url = $("#ConnectionURL").val();
    tableau.connectionName = $("#ConnectionName").val();

    const success = response => {
      validateResponse(response);
      tableau.connectionData = response;
      initCallback();
      tableau.submit();
    };

    const error = (xhr, status, errorThrown) => {
      throw errorThrown;
    };

    $.ajax({
      dataType: "json",
      url: `${url}/data`,
      success,
      error
    });
  };
})();
