let CONTENT_TYPE = 'Content-Type';
let JSON_CONTENT_TYPE = 'application/json';
let _ = require('../../../../utils/mindash');

module.exports = {
  id: 'parseJSON',
  after: function (res) {
    if (isJson(res)) {
      return res.json().then(function (body) {
        res.body = body;

        return res;
      });
    }

    return res;
  }
};

function isJson(res) {
  let contentTypes = res.headers.get(CONTENT_TYPE);

  if (!_.isArray(contentTypes)) {
    if (contentTypes === undefined || contentTypes === null) {
      contentTypes = [];
    } else {
      contentTypes = [contentTypes];
    }
  }

  return _.any(contentTypes, function (contentType) {
    return contentType.indexOf(JSON_CONTENT_TYPE) !== -1;
  });
}
