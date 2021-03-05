var Document = require( 'pelias-model' ).Document;
var logger = require( 'pelias-logger' ).get( 'geonames' );
var categoryMapping = require( '../../metadata/category_mapping.json' );
var popularityMapping = require( '../../metadata/popularity_mapping.json' );
var through2 = require('through2');

// common name delimiters
const NAME_DELIM_REGEX = /[,#\/]/;

module.exports = {};

module.exports.create = function() {
  return through2.obj(function(data, enc, next) {
    var record;
    try {

      // names
      // note: some name fields contain a delimited list
      // eg. 'Bern/Berne/Berna'
      var names = data.name.trim().split(NAME_DELIM_REGEX).filter(n => n.length);

      var layer = data.layer || 'venue';
      record = new Document( 'geonames', layer, data._id )
        .setName( 'default', names[0].trim() )
        .setCentroid({
          lat: data.latitude,
          lon: data.longitude
        });

      // altnames
      try {
        names.forEach((name, i) => {
          let trimmed = name.trim();
          if( trimmed.length ){
            if( i > 0 ){
              record.setNameAlias( 'default', trimmed );
            }
          }
        });
      } catch( err ){}

      try {
        var population = parseInt(data.population, 10);
        if (population) {
          record.setPopulation( population );
        }
      } catch( err ){}

      if( typeof data.feature_code === 'string' && data.feature_code.length > 0 ){
        const featureCode = data.feature_code.toUpperCase().trim();
        record.setMeta( 'fcode', featureCode );

        // store the feature code in the addendum
        record.setAddendum('geonames', {
          feature_code: featureCode
        });

        // map feature code to pelias categories
        if( categoryMapping.hasOwnProperty( featureCode ) ){
          var peliasCategories = categoryMapping[ featureCode ];
          peliasCategories.forEach( function ( category ){
            record.addCategory( category );
          });
        }

        // map feature code to pelias popularity score
        if( popularityMapping.hasOwnProperty( featureCode ) ){
          record.setPopularity( popularityMapping[ featureCode ] );
        }
      }

    } catch( e ){
      logger.warn(
        'Failed to create a Document from:', data, 'Exception:', e
      );
    }

    if( record !== undefined ){
      this.push( record );
    }
    next();
  });
};
