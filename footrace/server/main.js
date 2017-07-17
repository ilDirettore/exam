import { Meteor } from 'meteor/meteor';
import validator from 'validator';
import { HTTP } from 'meteor/http';

Races = new Mongo.Collection('races');
urlCheck = 'http://run-check-2017.mvlabs.it/check/';

Meteor.startup(() => {
  //recheckRunner(Races);

  // Global API configuration
  var Api = new Restivus({
    prettyJson: true,
    apiPath: '/'
  });

  Api.addCollection(Races);

  Api.addRoute('tempo/:GARA', {
    post: function() {

      record = {
        idRace: this.urlParams.GARA,
        idRunner: this.bodyParams.id_runner,
        result: this.bodyParams.result
      }

      if (!dataValidation(record)) {
        return {
          statusCode: 400,
          message: 'data incorrect'
        }
      }

      runnerValid = runnerValidation(record.idRunner);

      switch (runnerValid) {
        case 1:
        response = Races.insert(record);
        if (!(response === 'undefined')) {
          return {
            statusCode: 200,
            message: 'race result inserted'
          }
        }
        else {
          return {
            statusCode: 500,
            message: 'internal error'
          }
        }
        break;
        case 0:
        record.result = null;

        response = Races.insert(record);
        if (!(response === 'undefined')) {
          return {
            statusCode: 200,
            message: 'race result inserted without time race (runner is disqualified)'
          }
        }
        else {
          return {
            statusCode: 500,
            message: 'internal error'
          }
        }
        break;
        case -1:
        record.verified = false;

        response = Races.insert(record);
        if (!(response === 'undefined')) {
          return {
            statusCode: 200,
            message: 'risultato gara inserito anche se non è stato possibile verificare il corridore. Verrà eseguito in un momento successivo'
          }
        }
        else {
          return {
            statusCode: 500,
            message: 'internal error'
          }
        }
        break;

      }

    }
  });

});

function dataValidation(record) {
  return validator.isInt(record.idRunner, {min: 1, max: 150}) && validator.isFloat(record.result);
}

function runnerValidation(id) {
  try {
    response = HTTP.get(urlCheck.concat(id));
    responseJSON = JSON.parse(response.content);

    if (response.statusCode == 200) {
      if (responseJSON.valid == true) {
        return 1;
      }
      else {
        return 0;
      }
    }
    else {
      return -1;
    }

  } catch (e) {
    return -1;
  }

}

function recheckRunner(Races) {
  console.log(Races.find({verified: false}).fetch())
}
